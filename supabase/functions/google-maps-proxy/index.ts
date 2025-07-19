import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Google Maps Proxy called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    console.log('Google Maps API Key available:', !!googleMapsApiKey);
    
    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    let requestBody
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      requestBody = JSON.parse(text);
      console.log('Parsed request body:', requestBody);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { endpoint } = requestBody
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle different Google Maps API endpoints
    let response;
    let data;
    
    switch (endpoint) {
      case 'places-autocomplete':
        const input = requestBody.input
        
        console.log('Making NEW Places API autocomplete request for:', input);
        
        try {
          // NEW Places API uses POST with JSON body
          response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': googleMapsApiKey
            },
            body: JSON.stringify({
              input: input,
              includedPrimaryTypes: ['address'],
              languageCode: 'en',
              regionCode: 'NG'  // Focus on Nigeria
            })
          });
          
          if (!response.ok) {
            console.error('Places API HTTP error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Places API error response:', errorText);
            throw new Error(`Places API error: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }
        
        try {
          data = await response.json();
          console.log('NEW Places API response:', JSON.stringify(data, null, 2));
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          const textResponse = await response.text();
          console.error('Raw response text:', textResponse);
          throw new Error('Invalid JSON response from Places API');
        }
        
        // Transform NEW Places API response to match expected format
        // The NEW API returns { suggestions: [...] } where each suggestion has placePrediction
        if (data.suggestions && Array.isArray(data.suggestions)) {
          console.log('Found suggestions, transforming...');
          const transformedPredictions = data.suggestions.map((suggestion: any) => {
            console.log('Processing suggestion:', JSON.stringify(suggestion, null, 2));
            return {
              description: suggestion.placePrediction?.text?.text || suggestion.text?.text || 'Unknown location',
              place_id: suggestion.placePrediction?.placeId || 'unknown',
              structured_formatting: {
                main_text: suggestion.placePrediction?.structuredFormat?.mainText?.text || '',
                secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || ''
              }
            };
          });
          
          data = {
            predictions: transformedPredictions
          };
          console.log('Transformed data:', JSON.stringify(data, null, 2));
        } else {
          console.log('No suggestions found in response or wrong format');
          console.log('Available data keys:', Object.keys(data));
          data = { predictions: [] };
        }
        break;
        
      case 'place-details':
        const placeId = requestBody.place_id
        
        console.log('Making NEW Places API place details request for:', placeId);
        
        // NEW Places API for place details
        response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': googleMapsApiKey,
            'X-Goog-FieldMask': 'formattedAddress,addressComponents,location'
          }
        });
        
        data = await response.json();
        console.log('NEW Places API place details response:', data);
        
        // Transform to match expected format
        if (data.formattedAddress) {
          data = {
            result: {
              formatted_address: data.formattedAddress,
              address_components: data.addressComponents || [],
              geometry: {
                location: {
                  lat: data.location?.latitude || 0,
                  lng: data.location?.longitude || 0
                }
              }
            }
          };
        }
        break;
        
      case 'geocode':
        const address = requestBody.address
        const latlng = requestBody.latlng
        
        let geocodeUrl = '';
        if (address) {
          geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
        } else if (latlng) {
          geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${googleMapsApiKey}`
        }
        
        response = await fetch(geocodeUrl);
        data = await response.json();
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    console.log('Final transformed data:', data);

    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Google Maps Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})