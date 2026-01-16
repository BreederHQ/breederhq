// Global type declarations for third-party SDKs

interface Window {
  Stripe?: (publishableKey: string) => StripeInstance;
}

interface StripeInstance {
  verifyIdentity: (clientSecret: string) => Promise<{
    error?: {
      message?: string;
      type?: string;
    };
  }>;
}
