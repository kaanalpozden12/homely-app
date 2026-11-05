import { useEffect, useState } from 'react';
import { Modal, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TermsText } from '@/components/terms-text';
import { Header, s } from '@/components/ui';
import { C } from '@/lib/theme';

/** "terms and privacy policy" link that opens the terms over the current screen. */
export function TermsLink() {
  return <Text style={{ color: C.accent, fontWeight: '600' }} onPress={() => TermsModal.open()}>terms and privacy policy</Text>;
}

let setOpenGlobal: (v: boolean) => void = () => {};
export function TermsModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpenGlobal = setOpen; }, []);
  return (
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={s.screen}>
        <Header title="Terms and privacy" right={<Text onPress={() => setOpen(false)} style={{ color: C.accent, fontWeight: '700', fontSize: 15 }}>Close</Text>} />
        <TermsText />
      </SafeAreaView>
    </Modal>
  );
}
TermsModal.open = () => setOpenGlobal(true);
