/**
 * SMS / OTP sender — Koyamon Mart
 * Currently a stub. Wire up MSG91 or Twilio when provider is chosen.
 */

/**
 * Send OTP via SMS
 * @param {string} phone - Mobile number with country code (e.g. +919876543210)
 * @param {string} otp   - 6-digit OTP
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
async function sendOTP(phone, otp) {
  const provider = process.env.SMS_PROVIDER || 'console'; // 'msg91' | 'twilio' | 'console'

  if (provider === 'console') {
    // DEV mode: no real SMS gateway is wired up. Log the OTP for the server
    // operator and flag devMode so the caller can surface it to the client
    // (there is no other way for the user to obtain it in this mode).
    console.log(`📱 [DEV OTP] Phone: ${phone} | OTP: ${otp}`);
    return { success: true, messageId: 'dev-' + Date.now(), devMode: true };
  }

  if (provider === 'msg91') {
    return sendViaMSG91(phone, otp);
  }

  if (provider === 'twilio') {
    return sendViaTwilio(phone, otp);
  }

  throw new Error(`Unknown SMS provider: ${provider}`);
}

async function sendViaMSG91(phone, otp) {
  // TODO: Integrate MSG91 when AUTH_KEY is available
  // https://docs.msg91.com/reference/send-otp
  const url = `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${phone.replace('+', '')}&authkey=${process.env.MSG91_AUTH_KEY}&otp=${otp}`;
  const res = await fetch(url, {
    method: 'GET',
  });
  const data = await res.json();
  return { success: data.type === 'success', messageId: data.request_id };
}

async function sendViaTwilio(phone, otp) {
  // TODO: Integrate Twilio when credentials are available
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  const msg = await client.messages.create({
    body: `Your Koyamon Mart OTP is: ${otp}. Valid for 10 minutes. Do not share.`,
    from: process.env.TWILIO_FROM,
    to: phone,
  });
  return { success: msg.status !== 'failed', messageId: msg.sid };
}

module.exports = { sendOTP };
