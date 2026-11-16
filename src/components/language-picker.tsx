import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Chip, Chips, Field, Icon, s } from '@/components/ui';
import { findLanguage, langCode, POPULAR_LANGUAGES, searchLanguages } from '@/lib/languages';
import { C } from '@/lib/theme';

const MAX_RESULTS = 40;

/**
 * Pick any number of languages from the full list: chosen ones on top, a box to type into, and matches or popular picks below.
 * `anyLabel` adds an "Any language" chip for filters, where picking nothing means everyone.
 */
export function LanguagePicker({ selected, onChange, anyLabel, hideSelected, popular = POPULAR_LANGUAGES.length, autoFocus }: {
  selected: string[];
  onChange: (langs: string[]) => void;
  anyLabel?: string;
  hideSelected?: boolean;
  popular?: number;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchLanguages(q), [q]);
  const toggle = (l: string) => onChange(selected.includes(l) ? selected.filter((x) => x !== l) : [...selected, l]);
  const pick = (l: string) => { toggle(l); setQ(''); };
  const suggestions = POPULAR_LANGUAGES.filter((l) => !selected.includes(l)).slice(0, popular);

  return (
    <View>
      {!hideSelected && (anyLabel || selected.length > 0) && (
        <View style={{ marginBottom: 12 }}>
          <Chips wrap>
            {anyLabel && <Chip label={anyLabel} on={!selected.length} onPress={() => onChange([])} />}
            {selected.map((l) => (
              <Chip key={l} label={l} sub={langCode(l)} icon="close" on onPress={() => toggle(l)} />
            ))}
          </Chips>
        </View>
      )}
      <Field
        value={q}
        onChangeText={setQ}
        placeholder="Type any language, e.g. Tamil"
        icon="magnify"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={() => results[0] && pick(results[0].name)}
        accessibilityLabel="Search languages"
      />
      {q.trim() ? (
        results.length ? (
          <>
            <Chips wrap>
              {results.slice(0, MAX_RESULTS).map((l) => (
                <Chip key={l.name} label={l.name} sub={l.native ?? l.code} on={selected.includes(l.name)} onPress={() => pick(l.name)} />
              ))}
            </Chips>
            {results.length > MAX_RESULTS && <Text style={[s.hint, { marginTop: 8 }]}>Keep typing to see more.</Text>}
          </>
        ) : (
          <Text style={s.hint}>No language called “{q.trim()}”. Try another spelling.</Text>
        )
      ) : suggestions.length ? (
        <>
          <Text style={[s.hint, { marginBottom: 8 }]}>Popular in London</Text>
          <Chips wrap>
            {suggestions.map((l) => (
              <Chip key={l} label={l} sub={findLanguage(l)?.code} onPress={() => toggle(l)} />
            ))}
          </Chips>
        </>
      ) : null}
    </View>
  );
}

/** A chip that opens the language search, for compact rows like the home feed. */
export function MoreLanguagesChip({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: open }}
      style={[s.chip, { borderStyle: 'dashed', borderColor: C.accent }]}>
      <Icon name={open ? 'chevron-up' : 'magnify'} size={15} color={C.accent} />
      <Text style={[s.chipText, { color: C.accent }]}>{open ? 'Done' : 'All languages'}</Text>
    </Pressable>
  );
}
