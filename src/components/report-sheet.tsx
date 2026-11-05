import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button, Chip, Chips, Field, s } from '@/components/ui';
import { report } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { C } from '@/lib/theme';

const REASONS = ['Scam or fraud', 'Stolen or banned item', 'Offensive or abusive', 'Fake listing', 'Something else'];

export function ReportSheet({ open, onClose, listingId, userId, title }: {
  open: boolean; onClose: () => void; listingId?: string; userId?: string; title: string;
}) {
  const { session } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await report(session!.user.id, details.trim() ? `${reason}: ${details.trim()}` : reason, { listingId, userId });
      onClose();
      setReason(''); setDetails('');
      notify('Thanks for telling us', 'We will look at this within 24 hours.');
    } catch (e: any) {
      notify('Could not send the report', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 30, width: '100%', maxWidth: 560, alignSelf: 'center' }} onPress={() => {}}>
          <Text style={[s.h1, { fontSize: 21, flex: 0, marginBottom: 12 }]}>{title}</Text>
          <Chips wrap>{REASONS.map((r) => <Chip key={r} label={r} on={reason === r} onPress={() => setReason(r)} />)}</Chips>
          <View style={{ height: 14 }} />
          <Field label="Anything else? (optional)" value={details} onChangeText={setDetails} multiline maxLength={400} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancel" kind="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Send report" onPress={send} busy={busy} disabled={!reason} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
