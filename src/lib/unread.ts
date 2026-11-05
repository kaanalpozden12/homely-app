import { useEffect, useState } from 'react';

import { useAuth } from './auth';
import { supabase } from './supabase';

/** Number of chats with messages the user has not opened yet. Refreshes on new messages. */
export function useUnread() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('buyer_id, buyer_read_at, seller_read_at, last_message_at');
      setCount(
        (data ?? []).filter((c) => c.last_message_at > (c.buyer_id === uid ? c.buyer_read_at : c.seller_read_at)).length,
      );
    };
    load();
    const ch = supabase
      .channel('unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => setTimeout(load, 500))
      .subscribe();
    const t = setInterval(load, 30000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, [uid]);

  return count;
}
