module.exports = ({ config }) => ({
  ...config,
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_KEY ?? '',
    paypalClientId: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ?? '',
  },
});
