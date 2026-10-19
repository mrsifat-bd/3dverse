# Privacy policy: proposed changes (DRAFT, not live)

Status: proposal for the owner to approve. Nothing here is on the website yet.
Reason: the live policy does not match what the code does in three places.

## 1. Visit data is not "non-personal"

What the code does (`src/lib/leads.js`): on product views the visitor's browser
calls `https://ipwho.is/`, and the returned **IP address**, country, region and
city are stored with the visit and shown to admins in the Leads table.

Live text (What we collect):
> Basic, non-personal visit data: approximate city or country, device type and browser, and which products are viewed. A random visitor ID is kept in your browser to count visits.

Proposed text (choose A or B):

- **A, keep collecting IP:**
  > Visit data: your IP address and the approximate city or country it points to (looked up with the ipwho.is service), device type and browser, and which products you view. A random visitor ID is kept in your browser to count visits. We use this only to understand which products interest people.
- **B, stop storing IP (recommended, needs a small code change):** store only
  country/city, drop the `ip` field before saving, and keep the current
  sentence with "non-personal" removed:
  > Basic visit data: approximate city or country, device type and browser, and which products are viewed. A random visitor ID is kept in your browser to count visits.

Bangla (A):
> ভিজিট সংক্রান্ত তথ্য: আপনার আইপি অ্যাড্রেস ও সেটি থেকে আনুমানিক শহর বা দেশ (ipwho.is সার্ভিসের মাধ্যমে), ডিভাইস ও ব্রাউজারের ধরন, এবং আপনি কোন পণ্য দেখছেন। ভিজিট গোনার জন্য আপনার ব্রাউজারে একটি র‍্যান্ডম ভিজিটর আইডি রাখা হয়। কোন পণ্যে মানুষের আগ্রহ বেশি, শুধু তা বোঝার জন্য আমরা এটি ব্যবহার করি।

## 2. Name the service providers

Live text (Who we share it with) says "Our email provider". The code sends
order emails through **Resend**, and the visit lookup goes to **ipwho.is**.

Proposed bullets to add/replace:
> - Resend, which sends our order and account emails.
> - ipwho.is, which receives your IP address to look up your approximate location (only if option A above is kept).

Bangla:
> - Resend, যার মাধ্যমে অর্ডার ও অ্যাকাউন্টের ইমেইল পাঠানো হয়।
> - ipwho.is, যা আপনার আনুমানিক লোকেশন বের করতে আপনার আইপি অ্যাড্রেস পায় (উপরের A বিকল্প রাখলে)।

## 3. Google / Facebook login is mentioned but switched off

In Supabase Auth only the Email provider is enabled; Google and Facebook are
disabled. The policy (and possibly login page copy) mentions logging in with
them. Either enable them, or change:
> Account details: your email address, name and profile picture if you add one, or the basic profile Google or Facebook shares when you log in with them.

to:
> Account details: your email address, and your name and profile picture if you add them.

and remove the "Google or Facebook, only if you choose to log in with them" bullet
until those logins are turned on.

## After approval

1. Edit `src/i18n/content/en.js` and `src/i18n/content/bn.js` (`privacy` block) and bump `updated`.
2. For option B, change `src/lib/leads.js` to not send/store `ip`.
3. Existing stored IPs: decide whether to keep or clear them (data deletion is
   the owner's call; nothing is deleted by this audit).

This is not legal advice; for a formal review, consult a lawyer familiar with
Bangladesh data-protection rules.
