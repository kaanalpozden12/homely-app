import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, s } from '@/components/ui';
import { C } from '@/lib/theme';

// DRAFT: have these reviewed by a UK lawyer before the public launch.
const SECTIONS: [string, string][] = [
  ['What Homely is', 'Homely helps people in London buy and sell second-hand items locally. Buyers collect items in person and pay the seller directly. Homely does not handle payments or deliveries and is not a party to any sale.'],
  ['Who can use it', 'You must be 18 or over and live in the UK. Sellers must pass a one-time ID check before posting. One account per person.'],
  ['Selling', 'Describe items honestly, with real photos. Only sell things you own and are allowed to sell. Mark items as sold when they are gone.'],
  ['Items that are not allowed', 'Weapons and knives, medicines and drugs, alcohol and tobacco, counterfeit or stolen goods, animals, adult content, recalled or unsafe products (for example, used car seats or cot mattresses without safety labels), and anything illegal in the UK.'],
  ['Staying safe', 'Meet in a public place or bring a friend. Check the item before paying. Never pay in advance or share bank details in chat. Report anything suspicious using the Report button.'],
  ['Reports and removal', 'We review reports within 24 hours and may remove listings or suspend accounts that break these rules. You can block anyone, which hides their listings and stops messages between you.'],
  ['Your data', 'We store your email, name, neighbourhood, languages, optional phone and Instagram, your listings, photos and chats. Your exact pickup postcode is used only to calculate distances and is never shown to other users. Phone and Instagram are only shared when you choose to share them in a chat. We do not sell your data. Data is stored with Supabase (our database provider).'],
  ['ID checks', 'Sellers verify their identity once. During the pilot this is a short video call; later it may use an ID verification provider. We keep only whether you passed, not copies of your documents.'],
  ['Deleting your account', 'You can delete your account at any time from Profile > Delete my account. This permanently removes your profile, listings, photos and chats.'],
  ['Contact', 'Questions or data requests: email the Homely team (address to be added before launch).'],
];

export function TermsText() {
  return (
      <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 40 }]}>
        <Text style={[s.hint, { marginBottom: 8 }]}>Draft, November 2026</Text>
        {SECTIONS.map(([h, b]) => (
          <Text key={h} style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{h}{'\n'}</Text>
            <Text style={s.p}>{b}</Text>
          </Text>
        ))}
      </ScrollView>
  );
}

export default function Terms() {
  return (
    <SafeAreaView style={s.screen}>
      <Header title="Terms and privacy" back />
      <TermsText />
    </SafeAreaView>
  );
}
