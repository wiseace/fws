import React, { useState, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  className = "",
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('code, name, symbol')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency);

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Globe className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`${className} bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
          <Globe className="w-4 h-4 mr-2" />
          {selectedCurrencyData ? (
            <span className="font-medium">
              {selectedCurrencyData.symbol} {selectedCurrencyData.code}
            </span>
          ) : (
            <span>Select Currency</span>
          )}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-lg">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => onCurrencyChange(currency.code)}
            className={`cursor-pointer transition-colors ${
              selectedCurrency === currency.code 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center">
                <span className="font-semibold mr-2">{currency.symbol}</span>
                <span>{currency.name}</span>
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {currency.code}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};