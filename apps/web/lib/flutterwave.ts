'use client';

// Flutterwave Checkout configuration for Angola
export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number?: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: Record<string, string>;
}

export function generateTxRef(plan: string): string {
  return `nx_${plan}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export function getFlutterwaveConfig(
  plan: string,
  price: number,
  customerEmail: string,
  customerName: string
): FlutterwaveConfig {
  return {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: generateTxRef(plan),
    amount: price,
    currency: 'KZ',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: customerEmail,
      name: customerName,
    },
    customizations: {
      title: `NEXUS IA - Plano ${plan.toUpperCase()}`,
      description: `Assinatura NEXUS IA - Plano ${plan}`,
      logo: 'https://nexus-ia.ao/logo.png',
    },
    meta: {
      plan,
      source: 'web_checkout',
    },
  };
}

// Load Flutterwave script dynamically
export function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave'));
    document.body.appendChild(script);
  });
}
