import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Urbanist', 'system-ui', 'sans-serif'],
				'urbanist': ['Urbanist', 'system-ui', 'sans-serif'],
				'inter': ['Inter', 'system-ui', 'sans-serif'],
				'playfair': ['Playfair Display', 'serif']
			},
			fontSize: {
				'h1': ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }], // 32px
				'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }], // 24px
				'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '500' }], // 20px
				'h4': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '500' }], // 18px
				'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }], // 16px
				'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }], // 14px
				'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }], // 12px
				'caption-sm': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }] // 13px
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--brand-primary-light))',
					lighter: 'hsl(var(--brand-primary-lighter))',
					dark: 'hsl(var(--brand-primary-dark))',
					darker: 'hsl(var(--brand-primary-darker))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--brand-secondary-light))',
					lighter: 'hsl(var(--brand-secondary-lighter))',
					dark: 'hsl(var(--brand-secondary-dark))',
					darker: 'hsl(var(--brand-secondary-darker))'
				},
				brand: {
					primary: 'hsl(var(--brand-primary))',
					'primary-light': 'hsl(var(--brand-primary-light))',
					'primary-lighter': 'hsl(var(--brand-primary-lighter))',
					'primary-dark': 'hsl(var(--brand-primary-dark))',
					'primary-darker': 'hsl(var(--brand-primary-darker))',
					secondary: 'hsl(var(--brand-secondary))',
					'secondary-light': 'hsl(var(--brand-secondary-light))',
					'secondary-lighter': 'hsl(var(--brand-secondary-lighter))',
					'secondary-dark': 'hsl(var(--brand-secondary-dark))',
					'secondary-darker': 'hsl(var(--brand-secondary-darker))',
					success: 'hsl(var(--brand-success))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)', 
				'gradient-hero': 'var(--gradient-hero)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)' },
					'50%': { boxShadow: '0 0 0 8px hsl(var(--primary) / 0)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' }
				},
			'pulse-subtle': {
				'0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
				'50%': { opacity: '0.8', transform: 'scale(1.05)' }
			},
			'ping-strong': {
				'0%': { transform: 'scale(1)', opacity: '1' },
				'50%': { transform: 'scale(1.15)', opacity: '0.8' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-in-up': 'fade-in-up 0.5s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'bounce-subtle': 'bounce-subtle 2s infinite',
				'pulse-glow': 'pulse-glow 2s infinite',
				'float': 'float 6s ease-in-out infinite',
				'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
				'ping-strong': 'ping-strong 2s cubic-bezier(0, 0, 0.2, 1) infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
