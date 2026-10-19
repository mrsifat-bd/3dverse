/* eslint-disable import/no-anonymous-default-export */
// Long page copy for server components only (never imported by client code).
// Links inside text use [label](/path); PolicyPage turns them into links.
export default {
  meta: {
    homeTitle: '3D Verse BD | 3D Printing in Bangladesh',
    homeDescription: '3D printed anatomical and bone models, Islamic décor, desk organisers and phone stands, made to order and delivered across Bangladesh.',
    notFoundTitle: 'Page not found',
    productTitle: '{name}',
    productDescription: '{name} price in Bangladesh: {price}. {summary}',
    shopTitle: 'Shop All 3D Printed Products',
    shopDescription: 'Browse all 3D Verse products: anatomical and bone models, Islamic décor, pen holders, phone stands and desk organisers. Search, filter and order online: delivery charge via bKash, product price cash on delivery.',
    categoryTitle: '3D Printed {name} in Bangladesh',
    categoryDescription: '3D printed {name}, made to order and delivered across Bangladesh. Order online with cash on delivery.',
    aboutTitle: 'About Us',
    aboutDescription: 'About 3D Verse: a 3D printing studio focused on precise anatomical and educational models, personalised pieces and useful everyday prints, delivering across Bangladesh.',
    contactTitle: 'Contact Us | Custom 3D Printing in Bangladesh',
    contactDescription: 'Contact 3D Verse for custom 3D printing, medical and anatomical models, personalised products, bulk orders and custom design services anywhere in Bangladesh.',
    faqTitle: 'FAQ: Ordering, Delivery & Payment',
    faqDescription: 'Answers about ordering 3D printed products from 3D Verse BD: delivery charges, bKash payment, cash on delivery, cancellation, timelines, tracking and returns.',
    trackTitle: 'Track Your Order',
    trackDescription: 'Check the status of your 3D Verse BD order with your order number and phone number.',
    shippingTitle: 'Shipping & Delivery Policy',
    shippingDescription: 'Delivery charges, zones and timelines for 3D Verse BD orders across Bangladesh. Delivery charge via bKash, product price cash on delivery.',
    refundTitle: 'Refund & Return Policy',
    refundDescription: 'How returns, reprints, cancellations and refunds work at 3D Verse BD for made-to-order 3D printed products.',
    privacyTitle: 'Privacy Policy',
    privacyDescription: 'What personal information 3D Verse BD collects, why, who it is shared with, and how to ask us to delete it.',
    termsTitle: 'Terms & Conditions',
    termsDescription: 'The terms for ordering made-to-order 3D printed products from 3D Verse BD.',
  },

  home: {
    popularTitle: 'Popular',
    popularBlurb: 'Our most-loved, best-selling prints. Start here.',
    chat: 'Chat with us',
    categoriesTitle: 'Shop by category',
    categoriesText: "Find exactly what you're looking for.",
    viewAll: 'View all',
    explore: 'Explore',
    featured: 'Featured products',
    aboutTitle: '3D Verse: 3D printing for all of Bangladesh',
    aboutText: 'We 3D print every item to order: medical and bone anatomy models, Islamic décor, pen holders, phone stands and desk pieces, or your own design. We deliver anywhere in Bangladesh by courier, and you pay for the product in cash on delivery.',
    allProducts: 'See all products',
    moreQuestions: 'More questions',
    brandTitle: 'Designed and printed with care, delivered nationwide',
    brandText: '3D Verse designs and 3D-prints made-to-order products for customers across Bangladesh.',
    ourStory: 'Our story',
    stepsTitle: 'Ordering is simple',
    step1: 'Browse and add products to your cart.',
    step2: 'Check out: add your address, then prepay only the delivery charge via bKash.',
    step3: 'We confirm your order and deliver. Pay for the product on delivery.',
  },

  // Bangla category descriptions live in content/bn.js; English uses the database text.
  categoryBlurbs: {},

  category: {
    note: 'Made to order and delivered across Bangladesh. Order online: delivery charge via bKash, product price cash on delivery.',
  },

  faqPage: {
    title: 'Frequently asked questions',
    intro: 'Ordering, delivery, payment, cancellation and returns.',
    more: 'More detail:',
  },

  about: {
    eyebrow: 'About us',
    title: 'Precise, well-designed 3D printing, delivered across Bangladesh.',
    lead: '',
    story: [
      '{name} is a 3D printing studio built around a simple idea: turn digital designs into physical products that are accurate, well-finished and genuinely useful. We design and print for students, clinics, educators, businesses and gift-givers all over Bangladesh.',
      'We care about the details that matter: clean geometry, precise dimensions and a proper finish on every piece. Ordering is simple: browse the catalog, add what you like to your cart and check out right here on the site. You pay the delivery charge in advance via bKash and the product price in cash on delivery. We then confirm the lead time and delivery with you directly.',
    ],
    whatTitle: 'What we do',
    whatText: 'A focus on quality, precision and design across everything we print.',
    what: [
      { title: 'Medical & anatomical models', body: 'Accurate skulls, bones, vertebrae and study sets for students and clinics.' },
      { title: 'Educational products', body: 'Hands-on learning models and teaching aids that make concepts easier to grasp.' },
      { title: 'Personalised products', body: 'Thoughtful, made-to-order keepsakes and gifts for people and occasions.' },
      { title: 'Everyday useful prints', body: 'Practical home, desk and utility pieces designed to be genuinely useful.' },
    ],
    teamTitle: 'People behind 3D Verse',
    teamText: 'The team designing, printing and standing behind every order.',
    roles: { md: 'Co-Founder & Managing Director', cofounder: 'Co-Founder', advisor: 'Chief Advisor' },
    processTitle: 'How we work',
    process: [
      { title: 'Order Confirmation', body: 'We confirm your order and finalise the required details.' },
      { title: '3D Design', body: 'Our designers prepare or refine the required design.' },
      { title: 'Production', body: 'The finalised design goes into 3D printing and production.' },
      { title: 'Post-Processing', body: 'The printed piece receives the necessary finishing.' },
      { title: 'Quality Check', body: 'Every finished product is checked before dispatch.' },
      { title: 'Delivery', body: 'The product is carefully packed and sent by courier anywhere in Bangladesh.' },
    ],
    valuesTitle: 'What we care about',
    values: ['Quality', 'Precision', 'Innovation', 'Thoughtful Design', 'Customer Satisfaction'],
    officeTitle: 'Serving customers across Bangladesh',
    officeText: "We print to order and deliver to every district by courier. Have an idea or a question? We're one message away.",
    contactUs: 'Contact us',
    followTitle: 'Follow our work',
    followText: 'See new prints, restocks and behind-the-scenes.',
  },

  contact: {
    eyebrow: 'Contact / 3D Verse',
    title: "Have an idea? Let's make it real.",
    lead: "Whether it's a custom print, an anatomical model, a bulk order or an idea you're still figuring out, tell us what you need. We'll help you take it from concept to finished piece.",
    startWhatsapp: 'Start on WhatsApp',
    sendEmail: 'Send an email',
    waHello: 'Hello 3D Verse,',
    waIdea: 'Hello 3D Verse, I have an idea I would like to make.',
    waMake: 'Hello 3D Verse, I would like to make something.',
    helpTitle: 'What can we help you make?',
    helpText: "Choose what you're looking for and we'll take it from there.",
    services: [
      { title: 'Custom 3D Printing', desc: "Have a model, idea or reference? Let's turn it into a physical piece.", cta: 'Start a custom order', wa: 'Hello 3D Verse, I would like to start a custom 3D printing order.' },
      { title: 'Medical & Anatomy', desc: 'Anatomical models, bones, vertebrae and study pieces for students and clinics.', cta: 'Ask about models', wa: 'Hello 3D Verse, I would like to ask about your medical / anatomical models.' },
      { title: 'Bulk & Business', desc: 'Need multiple pieces for a business, event, institution or project?', cta: 'Discuss a bulk order', wa: 'Hello 3D Verse, I would like to discuss a bulk / business order.' },
      { title: 'Something Else', desc: "Not sure which category fits? Tell us what you're trying to make.", cta: 'Talk to us', wa: "Hello 3D Verse, I have an idea I'd like to make. Can you help?" },
    ],
    directTitle: 'Prefer a direct conversation?',
    email: 'Email',
    office: 'Main office',
    directWhatsapp: 'Fastest way to discuss a custom idea or ask a question.',
    directWhatsappCta: 'Message us',
    directEmail: 'For detailed inquiries, business communication and collaboration.',
    directEmailCta: 'Send email',
    directOffice: 'Our main office and print studio. We deliver across Bangladesh.',
    directOfficeCta: 'View location',
    followTitle: 'Follow 3D Verse',
    followText: 'New prints, restocks and behind-the-scenes.',
    formTitle: "Tell us what you're working on.",
    formText: "Send us a few details and we'll help you figure out the next step. The form opens WhatsApp with everything filled in; just press send.",
    formPoints: [
      'Custom prints, designs, medical models and bulk orders.',
      'Share size, colour, quantity and a reference.',
      'We reply with design, pricing and lead time.',
    ],
    processTitle: 'From idea to finished piece.',
    process: [
      { title: 'Order Confirmation', body: 'We confirm your requirements and finalise the details.' },
      { title: '3D Design', body: 'Our designers prepare or refine the required design.' },
      { title: 'Production', body: 'The finalised design goes into 3D printing and production.' },
      { title: 'Post-Processing', body: 'Each printed piece receives the finishing it needs.' },
      { title: 'Quality Check', body: 'Every finished product is checked before dispatch.' },
      { title: 'Delivery', body: 'The completed piece is carefully packed and sent by courier.' },
    ],
    officeTitle: 'Our main office',
    officeText: 'Our main office and print studio are in Sylhet. We design and print here and deliver to customers in every part of Bangladesh.',
    mapTitle: '3D Verse main office on the map',
    faqs: [
      { q: 'How do I order a product from the shop?', a: 'Add it to your cart and check out on the site. You pay the delivery charge in advance via bKash and the product price in cash on delivery.' },
      { q: 'How do I place a custom order?', a: "Send us your idea, reference or requirements through WhatsApp. We'll discuss the design, material, size, pricing and lead time with you." },
      { q: 'Can you print a model I already have?', a: 'If you have a 3D model, send it to us so we can check whether it is suitable for printing.' },
      { q: 'Can you create the 3D model for me?', a: 'For custom projects, our design team can prepare or refine the required 3D design depending on the project.' },
      { q: 'Do you accept bulk orders?', a: 'Yes. Contact us with the required quantity and project details so we can discuss pricing and production.' },
      { q: 'Do you deliver all over Bangladesh?', a: 'Yes. We deliver to every district by courier. The delivery charge is shown at checkout once you choose your thana.' },
      { q: "What's the fastest way to contact you?", a: 'For products in the shop, order directly on the site. For custom projects or questions, WhatsApp is the fastest way to reach us.' },
    ],
    ctaTitle: "Let's turn your idea into something real.",
    ctaText: "Have a product in mind? Send us a message and let's figure it out together.",
    ctaWhatsapp: 'Message 3D Verse on WhatsApp',
  },

  policy: {
    updated: 'Last updated: {date}',
    questions: 'Questions?',
    see: 'See the [FAQ](/faq), or [contact us](/contact).',
    related: 'Related:',
    shipping: 'Shipping',
    refunds: 'Refunds & returns',
    privacy: 'Privacy',
    terms: 'Terms',
  },

  policies: {
    shipping: {
      title: 'Shipping & Delivery Policy',
      updated: '17 October 2026',
      intro: 'Every product is 3D printed after you order, then sent by courier anywhere in Bangladesh. Here is how delivery works, what it costs and how long it takes.',
      sections: [
        {
          heading: 'Delivery charges',
          body: [
            'The delivery charge depends on where you are and how heavy the parcel is. The exact amount is shown at checkout after you choose your police station (thana).',
            [
              'Sylhet city (Sylhet Sadar and Dakshin Surma thana): ৳70 up to 1 kg, ৳160 up to 2 kg, ৳190 up to 3 kg.',
              'Everywhere else in Bangladesh: ৳120 up to 1 kg, ৳210 up to 2 kg, ৳240 up to 3 kg.',
              'Above 3 kg: ৳30 for each extra kg.',
            ],
            'Parcel weight is the printed weight of your products plus about 80 g of packaging per item.',
          ],
        },
        {
          heading: 'How you pay',
          body: [
            'You pay only the delivery charge in advance, by bKash Send Money, during checkout. The product price is paid in cash to the courier when your parcel arrives (cash on delivery).',
            'We check every bKash payment by hand before we start printing. If something does not match, we contact you on the phone number you gave.',
          ],
        },
        {
          heading: 'How long it takes',
          body: [
            [
              'Printing: usually 1–3 working days after your payment is verified. Large models and full bone sets can take longer; we tell you when we confirm the order.',
              'Courier: usually 1–2 days inside Sylhet and 2–3 days to other districts.',
            ],
            'Delays can happen during holidays, bad weather or courier backlogs. We will keep you informed.',
          ],
        },
        {
          heading: 'Courier and tracking',
          body: [
            'Orders are delivered by Steadfast Courier. Once your parcel is handed over, a tracking code appears on your order.',
            'You can check your order any time on the [Track order](/track) page with your order number and phone number, or under [My Orders](/account/orders) when you are logged in.',
          ],
        },
        {
          heading: 'At delivery',
          body: [
            'Please check the parcel in front of the delivery person before you pay. If it is damaged, you can refuse it and tell us right away.',
            'If a parcel is refused or cannot be delivered because the address or phone number was wrong, the delivery charge cannot be refunded, because the courier has already been paid.',
          ],
        },
      ],
    },

    refund: {
      title: 'Refund & Return Policy',
      updated: '19 October 2026',
      intro: 'Every item is printed specially for you, so returns work a little differently from a regular shop. We always make it right when something is our fault.',
      sections: [
        {
          heading: 'Damaged, wrong or faulty items',
          body: [
            'If your product arrives broken, is not what you ordered, or has a clear printing defect, tell us within 48 hours of delivery. Send your order number with clear photos or an unboxing video.',
            'We will reprint and resend the item at no cost to you. If a reprint is not possible, we refund what you paid for that item.',
          ],
        },
        {
          heading: 'Cancelling an order',
          body: [
            [
              'Before we verify your bKash payment: you can cancel the order yourself from [My Orders](/account/orders).',
              'Before printing starts: cancel any time by contacting us. The bKash delivery charge is refunded in full.',
              'After printing has started: the order can no longer be cancelled, because the item is being made for you.',
            ],
            'If we cannot make or deliver your order for any reason, we cancel it and refund the delivery charge in full.',
          ],
        },
        {
          heading: 'Change of mind',
          body: [
            'Because products are made to order, we cannot accept returns just because you changed your mind, chose the wrong size or colour, or no longer need the item. Please check the product details, size and colour before ordering, and ask us if anything is unclear.',
          ],
        },
        {
          heading: 'What is normal for 3D prints',
          body: [
            'Fine layer lines, small surface marks and slight colour differences from photos are a normal part of 3D printing and are not defects. Some product photos are digital renders, so the printed item can look slightly different in colour and finish.',
          ],
        },
        {
          heading: 'How refunds are paid',
          body: [
            'Refunds are sent by bKash to the number you paid from, usually within 3 working days after we approve them. If you already paid the product price in cash, that amount is refunded by bKash too.',
          ],
        },
      ],
    },

    privacy: {
      title: 'Privacy Policy',
      updated: '17 October 2026',
      intro: 'We collect only what we need to take and deliver your orders. We never sell your information.',
      sections: [
        {
          heading: 'What we collect',
          body: [
            [
              'Account details: your email address, name and profile picture if you add one, or the basic profile Google or Facebook shares when you log in with them.',
              'Order details: name, phone number, delivery address, police station (thana), order notes and the bKash transaction ID for your delivery charge.',
              'Reviews you write, including any photo you attach.',
              'Your email address if you subscribe to offers.',
              'Basic, non-personal visit data: approximate city or country, device type and browser, and which products are viewed. A random visitor ID is kept in your browser to count visits.',
            ],
          ],
        },
        {
          heading: 'Why we use it',
          body: [
            ['To process, verify and deliver your orders and keep you updated about them.', 'To answer your questions and handle returns.', 'To improve the shop, for example knowing which products people look at.', 'To send offers, only if you subscribed. You can unsubscribe at any time.'],
          ],
        },
        {
          heading: 'Who we share it with',
          body: [
            'Only the services needed to run the shop:',
            [
              'Steadfast Courier, which receives your name, phone, address and the cash-on-delivery amount to deliver your parcel.',
              'Supabase and Vercel, which host our database and website.',
              'Our email provider, which sends order emails.',
              'Google or Facebook, only if you choose to log in with them.',
            ],
            'We do not sell or rent your information, and we do not share it for advertising.',
          ],
        },
        {
          heading: 'Cookies and browser storage',
          body: ['We use your browser storage to keep you logged in, remember your theme and language, and count visits. We do not use advertising cookies.'],
        },
        {
          heading: 'How long we keep it',
          body: ['Order records, including cancelled orders, are kept for our accounts and for warranty or delivery questions. You can ask us to delete your account and personal details at any time; we only keep what we must keep for completed orders.'],
        },
        {
          heading: 'Your choices',
          body: ['To see, correct or delete your information, email {email} or call {phone}. We reply within a few working days.'],
        },
      ],
    },

    terms: {
      title: 'Terms & Conditions',
      updated: '19 October 2026',
      intro: 'These terms apply when you use 3dversebd.com or order from 3D Verse BD. By placing an order you agree to them.',
      sections: [
        {
          heading: 'Orders and prices',
          body: [
            'All prices are in Bangladeshi Taka (৳). Products are made to order. Your order is confirmed once we have verified your bKash delivery-charge payment. Until then you can cancel it yourself from My Orders, and we may cancel it, for example if a product cannot be made.',
            'If a price on the site is clearly wrong, we will contact you before printing and you can cancel at no cost.',
          ],
        },
        {
          heading: 'Payment',
          body: ['You pay the delivery charge in advance by bKash and the product price in cash on delivery. A transaction ID that matches the format is not proof of payment; we check each payment by hand.'],
        },
        {
          heading: 'Products',
          body: [
            'Sizes and weights are approximate. Colours on screen and in photos, some of which are digital renders, can differ slightly from the printed item. Fine layer lines are normal for 3D printing.',
            'Medical and anatomical models are for education, study and display only. They are not medical devices and must not be used for diagnosis or treatment.',
          ],
        },
        {
          heading: 'Custom orders',
          body: ['For custom prints you must own, or have permission to use, any design, logo or file you send us. We may refuse designs that infringe someone else’s rights or are unsafe or illegal.'],
        },
        {
          heading: 'Delivery, returns and privacy',
          body: ['Delivery is covered in our [Shipping policy](/shipping-policy), returns and refunds in our [Refund policy](/refund-policy), and your data in our [Privacy policy](/privacy-policy).'],
        },
        {
          heading: 'Liability',
          body: ['Our responsibility for any order is limited to the amount you paid for it. Nothing in these terms takes away rights you have under the laws of Bangladesh.'],
        },
        {
          heading: 'Changes',
          body: ['We may update these terms. The version on this page when you place your order applies to that order. If the English and Bangla versions differ, the English version applies.'],
        },
      ],
    },
  },
}
