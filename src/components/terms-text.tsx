import { router } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, s } from '@/components/ui';
import { CONTACT, LEGAL_UPDATED, OPERATOR } from '@/lib/legal';
import { C } from '@/lib/theme';

// Plain-English terms and privacy policy for a UK marketplace run by an individual.
// Have a UK solicitor look over them once Loftrobin grows; they are written to cover the basics of
// UK GDPR, the Online Safety Act and consumer law for a small pilot.

type Section = [string, string];

export const TERMS: Section[] = [
  ['What Loftrobin is', `Loftrobin helps people in London buy and sell second-hand household items locally. Buyers collect items in person and pay the seller directly. Loftrobin is run by ${OPERATOR}. Loftrobin is not the seller of any item and is not a party to the sale between buyer and seller.`],
  ['Who can use it', 'You must be 18 or over and live in the UK. One account per person. Give true information about yourself.'],
  ['Selling', 'Describe items honestly with real photos of the actual item. Only sell things you own and are allowed to sell. Tell buyers about any faults. Mark items as sold or delete them when they are gone. Loftrobin is for private individuals; if you sell as a business you must say so and follow consumer law.'],
  ['Buying', 'Check the item before you pay. Sales between private individuals are "as described": the item must match its description, but the seller does not have to give a refund if you change your mind. Never pay in advance or by bank transfer before seeing the item.'],
  ['Reserving and the Loftrobin fee', 'You can reserve an item in the app. The item is then held for you and the seller is told in your chat. While Loftrobin is new, reserving is free. When a reservation fee applies, the amount is shown before you pay and is charged to your card by our payment provider, Stripe. The fee is refunded if the seller cancels the reservation or the item is no longer available. It is not refunded if you cancel or do not turn up. The item price itself is always paid to the seller in person.'],
  ['Items that are not allowed', 'Weapons and knives, medicines and drugs, alcohol and tobacco, vapes, counterfeit or stolen goods, animals, adult content, recalled or unsafe products (for example used car seats, or cot mattresses and upholstered furniture without fire safety labels), and anything illegal in the UK.'],
  ['Behaviour', 'Be respectful. No harassment, hate speech, threats, spam, scams, or sharing other people\'s personal details. Do not use Loftrobin to advertise other services or to move people off the app to pay in advance.'],
  ['Staying safe', 'Meet in a public place or bring a friend. Check the item before paying. Never share bank details or one-time codes in chat. Report anything suspicious with the Report button.'],
  ['Reports, removal and appeals', 'Anyone can report a listing or a person from the app. We review reports, usually within 24 hours. We may remove content, hide listings, or suspend or ban accounts that break these terms or the law, and we report illegal content to the police where required. A listing reported by several people is hidden automatically until we review it. If you think we got it wrong, contact us (see below) and a person will look at it again.'],
  ['Blocking', 'You can block anyone. You will not see each other\'s listings and cannot message each other.'],
  ['Our responsibility', 'We work hard to keep Loftrobin safe, but we do not check items, and we are not responsible for the condition of items, for what happens at a pickup, or for disputes between buyers and sellers, except where the law says we are. Nothing in these terms limits your rights under UK consumer law or our liability for death or personal injury caused by our negligence.'],
  ['Ending your account', 'You can delete your account at any time from Profile > Delete my account. We may close accounts that break these terms.'],
  ['Changes and law', 'We may update these terms; we will tell you in the app about important changes. These terms are governed by the law of England and Wales.'],
  ['Contact', `Questions, complaints or appeals: ${CONTACT}.`],
];

export const PRIVACY: Section[] = [
  ['Who is responsible for your data', `${OPERATOR} runs Loftrobin and is the "data controller" for your personal data under UK GDPR. Contact: ${CONTACT}.`],
  ['What we collect', 'Your email address (and, if you sign in with Google, the name and email Google shares with us); your first name, neighbourhood and the languages you speak; optional phone number and Instagram; your listings and photos; the pickup postcode of each listing; your chats; reports and blocks; reservations and fees; and, if you choose to do an ID check, whether you passed it. We do not keep copies of ID documents.'],
  ['Why we use it', 'To run your account and the marketplace (our contract with you); to keep people safe, prevent fraud and spam, and handle reports (our legitimate interests); and to keep payment records and meet legal duties (legal obligation).'],
  ['What other people see', 'Other users see your first name, neighbourhood, languages, ID-checked badge, listings and the first part of the pickup postcode (like SW3). Your exact pickup postcode is never shown: it is only used, rounded to about 500 metres, to work out distances. Your phone and Instagram are only shared when you tap Share contact in a chat.'],
  ['Who we share it with', 'We do not sell your data or use it for advertising. We use these providers to run Loftrobin: Supabase (database, sign-in and photo storage, hosted in London), Google (only if you choose to sign in with Google), Vercel (website hosting), Brevo (sign-in emails), Stripe (card payments, only if you pay a fee) and postcodes.io (turns a postcode into a map position). Some of them may process data outside the UK under approved safeguards. We share data with the police or other authorities when the law requires it.'],
  ['How long we keep it', 'Your account, listings, photos and chats are kept until you delete your account, and are then deleted. Records of reservations and fees are kept for 6 years because UK tax law requires it, without your name attached. Reports are kept for up to 2 years to keep the community safe.'],
  ['Cookies and storage', 'Loftrobin does not use advertising or tracking cookies. Your browser or phone stores your sign-in and your search settings so the app keeps working. These are strictly necessary, so no consent is needed. Stripe sets its own cookies on its payment page to prevent fraud.'],
  ['Your rights', 'You can ask for a copy of your data, ask us to correct or delete it, object to how we use it, or ask us to restrict it. You can delete your account yourself in the app. If you are unhappy with how we handle your data, you can complain to the Information Commissioner\'s Office (ico.org.uk).'],
  ['Children', 'Loftrobin is only for people aged 18 or over.'],
];

function Doc({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <>
      <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 4, marginTop: 8 }}>{title}</Text>
      <Text style={[s.hint, { marginBottom: 12 }]}>Last updated {LEGAL_UPDATED}</Text>
      {sections.map(([h, b]) => (
        <Text key={h} style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{h}{'\n'}</Text>
          <Text style={s.p}>{b}</Text>
        </Text>
      ))}
    </>
  );
}

export function TermsText({ only }: { only?: 'terms' | 'privacy' }) {
  return (
    <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }]}>
      {only !== 'privacy' && <Doc title="Terms of use" sections={TERMS} />}
      {only !== 'terms' && <Doc title="Privacy policy" sections={PRIVACY} />}
    </ScrollView>
  );
}

export function LegalScreen({ only }: { only: 'terms' | 'privacy' }) {
  return (
    <SafeAreaView style={s.screen}>
      <Header title={only === 'terms' ? 'Terms of use' : 'Privacy policy'} back />
      <TermsText only={only} />
      <Text style={[s.hint, { textAlign: 'center', padding: 12, color: C.accent, fontWeight: '600' }]}
        onPress={() => router.replace(only === 'terms' ? '/privacy' : '/terms')}>
        {only === 'terms' ? 'Read the privacy policy' : 'Read the terms of use'}
      </Text>
    </SafeAreaView>
  );
}

export default function Terms() {
  return <LegalScreen only="terms" />;
}
