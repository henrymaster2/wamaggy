type StkPushInput = {
  amount: number;
  phone: string;
  accountReference: string;
  transactionDesc: string;
};

type StkPushResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export const normalizeMpesaPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;

  throw new Error('Use a valid Kenyan phone number, for example 0712345678.');
};

const getTimestamp = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
};

const getAccessToken = async () => {
  const baseUrl = getRequiredEnv('MPESA_BASE_URL');
  const consumerKey = getRequiredEnv('MPESA_CONSUMER_KEY');
  const consumerSecret = getRequiredEnv('MPESA_CONSUMER_SECRET');
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.errorMessage || 'Failed to get M-Pesa access token.');
  }

  return data.access_token as string;
};

export const sendStkPush = async ({
  amount,
  phone,
  accountReference,
  transactionDesc,
}: StkPushInput) => {
  const baseUrl = getRequiredEnv('MPESA_BASE_URL');
  const shortcode = getRequiredEnv('MPESA_SHORTCODE');
  const passkey = getRequiredEnv('MPESA_PASSKEY');
  const callbackBaseUrl = getRequiredEnv('MPESA_CALLBACK_URL').replace(/\/$/, '');
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const accessToken = await getAccessToken();

  const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.max(1, Math.round(amount)),
      PartyA: normalizeMpesaPhone(phone),
      PartyB: shortcode,
      PhoneNumber: normalizeMpesaPhone(phone),
      CallBackURL: `${callbackBaseUrl}/api/mpesa/callback`,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 40),
    }),
  });

  const data = await response.json() as StkPushResponse;

  if (!response.ok || data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription || 'M-Pesa STK push failed.');
  }

  return data;
};
