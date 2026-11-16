/**
 * Every language people can pick: the full ISO 639-1 list (plus a few widely spoken extras such as Cantonese),
 * with English names and, where it helps, the name in the language itself.
 *
 * Profiles and the feed filter store the English name (e.g. "Turkish"), so never rename an entry here:
 * people who already picked it would no longer match. Adding new entries is always safe.
 */
export type Language = { name: string; code: string; native?: string };

const L = (name: string, code: string, native?: string): Language => ({ name, code, native });

export const ALL_LANGUAGES: Language[] = [
  L('Abkhaz', 'AB', 'Аҧсуа'), L('Afar', 'AA', 'Afaraf'), L('Afrikaans', 'AF'), L('Akan', 'AK'),
  L('Albanian', 'SQ', 'Shqip'), L('Amharic', 'AM', 'አማርኛ'), L('Arabic', 'AR', 'العربية'), L('Aragonese', 'AN', 'Aragonés'),
  L('Armenian', 'HY', 'Հայերեն'), L('Assamese', 'AS', 'অসমীয়া'), L('Avaric', 'AV', 'Авар'), L('Avestan', 'AE'),
  L('Aymara', 'AY', 'Aymar aru'), L('Azerbaijani', 'AZ', 'Azərbaycan'), L('Bambara', 'BM', 'Bamanankan'), L('Bashkir', 'BA', 'Башҡорт'),
  L('Basque', 'EU', 'Euskara'), L('Belarusian', 'BE', 'Беларуская'), L('Bengali', 'BN', 'বাংলা'), L('Bislama', 'BI'),
  L('Bosnian', 'BS', 'Bosanski'), L('Breton', 'BR', 'Brezhoneg'), L('Bulgarian', 'BG', 'Български'), L('Burmese', 'MY', 'မြန်မာ'),
  L('Cantonese', 'YUE', '粵語'), L('Catalan', 'CA', 'Català'), L('Chamorro', 'CH', 'Chamoru'), L('Chechen', 'CE', 'Нохчийн'),
  L('Chichewa', 'NY', 'Chicheŵa'), L('Chinese', 'ZH', '中文'), L('Chuvash', 'CV', 'Чӑваш'), L('Cornish', 'KW', 'Kernewek'),
  L('Corsican', 'CO', 'Corsu'), L('Cree', 'CR'), L('Croatian', 'HR', 'Hrvatski'), L('Czech', 'CS', 'Čeština'),
  L('Danish', 'DA', 'Dansk'), L('Dhivehi', 'DV', 'ދިވެހި'), L('Dutch', 'NL', 'Nederlands'), L('Dzongkha', 'DZ', 'རྫོང་ཁ'),
  L('English', 'EN'), L('Esperanto', 'EO'), L('Estonian', 'ET', 'Eesti'), L('Ewe', 'EE', 'Eʋegbe'),
  L('Faroese', 'FO', 'Føroyskt'), L('Fijian', 'FJ', 'Vosa Vakaviti'), L('Filipino', 'FIL'), L('Finnish', 'FI', 'Suomi'),
  L('French', 'FR', 'Français'), L('Fula', 'FF', 'Fulfulde'), L('Galician', 'GL', 'Galego'), L('Ganda', 'LG', 'Luganda'),
  L('Georgian', 'KA', 'ქართული'), L('German', 'DE', 'Deutsch'), L('Greek', 'EL', 'Ελληνικά'), L('Guarani', 'GN', "Avañe'ẽ"),
  L('Gujarati', 'GU', 'ગુજરાતી'), L('Haitian Creole', 'HT', 'Kreyòl ayisyen'), L('Hausa', 'HA'), L('Hebrew', 'HE', 'עברית'),
  L('Herero', 'HZ', 'Otjiherero'), L('Hindi', 'HI', 'हिन्दी'), L('Hiri Motu', 'HO'), L('Hungarian', 'HU', 'Magyar'),
  L('Icelandic', 'IS', 'Íslenska'), L('Ido', 'IO'), L('Igbo', 'IG'), L('Indonesian', 'ID', 'Bahasa Indonesia'),
  L('Interlingua', 'IA'), L('Interlingue', 'IE'), L('Inuktitut', 'IU', 'ᐃᓄᒃᑎᑐᑦ'), L('Inupiaq', 'IK', 'Iñupiaq'),
  L('Irish', 'GA', 'Gaeilge'), L('Italian', 'IT', 'Italiano'), L('Japanese', 'JA', '日本語'), L('Javanese', 'JV', 'Basa Jawa'),
  L('Kalaallisut', 'KL'), L('Kannada', 'KN', 'ಕನ್ನಡ'), L('Kanuri', 'KR'), L('Kashmiri', 'KS', 'कॉशुर'),
  L('Kazakh', 'KK', 'Қазақ'), L('Khmer', 'KM', 'ខ្មែរ'), L('Kikuyu', 'KI', 'Gĩkũyũ'), L('Kinyarwanda', 'RW', 'Ikinyarwanda'),
  L('Kirundi', 'RN', 'Ikirundi'), L('Komi', 'KV', 'Коми'), L('Kongo', 'KG', 'Kikongo'), L('Korean', 'KO', '한국어'),
  L('Kurdish', 'KU', 'Kurdî'), L('Kwanyama', 'KJ'), L('Kyrgyz', 'KY', 'Кыргызча'), L('Lao', 'LO', 'ລາວ'),
  L('Latin', 'LA', 'Latina'), L('Latvian', 'LV', 'Latviešu'), L('Limburgish', 'LI', 'Limburgs'), L('Lingala', 'LN'),
  L('Lithuanian', 'LT', 'Lietuvių'), L('Luba-Katanga', 'LU', 'Kiluba'), L('Luxembourgish', 'LB', 'Lëtzebuergesch'), L('Macedonian', 'MK', 'Македонски'),
  L('Malagasy', 'MG'), L('Malay', 'MS', 'Bahasa Melayu'), L('Malayalam', 'ML', 'മലയാളം'), L('Maltese', 'MT', 'Malti'),
  L('Manx', 'GV', 'Gaelg'), L('Māori', 'MI', 'Te reo Māori'), L('Marathi', 'MR', 'मराठी'), L('Marshallese', 'MH', 'Kajin M̧ajeļ'),
  L('Mongolian', 'MN', 'Монгол'), L('Nauruan', 'NA', 'Dorerin Naoero'), L('Navajo', 'NV', 'Diné bizaad'), L('Ndonga', 'NG', 'Owambo'),
  L('Nepali', 'NE', 'नेपाली'), L('North Ndebele', 'ND', 'isiNdebele'), L('Northern Sami', 'SE', 'Davvisámegiella'), L('Norwegian', 'NO', 'Norsk'),
  L('Norwegian Bokmål', 'NB', 'Norsk bokmål'), L('Norwegian Nynorsk', 'NN', 'Norsk nynorsk'), L('Nuosu', 'II', 'ꆈꌠ꒿'), L('Occitan', 'OC'),
  L('Ojibwe', 'OJ', 'ᐊᓂᔑᓈᐯᒧᐎᓐ'), L('Old Church Slavonic', 'CU'), L('Odia', 'OR', 'ଓଡ଼ିଆ'), L('Oromo', 'OM', 'Afaan Oromoo'),
  L('Ossetian', 'OS', 'Ирон'), L('Pali', 'PI', 'पाऴि'), L('Pashto', 'PS', 'پښتو'), L('Persian', 'FA', 'فارسی'),
  L('Polish', 'PL', 'Polski'), L('Portuguese', 'PT', 'Português'), L('Punjabi', 'PA', 'ਪੰਜਾਬੀ'), L('Quechua', 'QU', 'Runa Simi'),
  L('Romanian', 'RO', 'Română'), L('Romansh', 'RM', 'Rumantsch'), L('Russian', 'RU', 'Русский'), L('Samoan', 'SM', 'Gagana Sāmoa'),
  L('Sango', 'SG', 'Sängö'), L('Sanskrit', 'SA', 'संस्कृतम्'), L('Sardinian', 'SC', 'Sardu'), L('Scottish Gaelic', 'GD', 'Gàidhlig'),
  L('Serbian', 'SR', 'Српски'), L('Shona', 'SN', 'chiShona'), L('Sindhi', 'SD', 'سنڌي'), L('Sinhala', 'SI', 'සිංහල'),
  L('Slovak', 'SK', 'Slovenčina'), L('Slovenian', 'SL', 'Slovenščina'), L('Somali', 'SO', 'Soomaali'), L('South Ndebele', 'NR', 'isiNdebele'),
  L('Southern Sotho', 'ST', 'Sesotho'), L('Spanish', 'ES', 'Español'), L('Sundanese', 'SU', 'Basa Sunda'), L('Swahili', 'SW', 'Kiswahili'),
  L('Swati', 'SS', 'SiSwati'), L('Swedish', 'SV', 'Svenska'), L('Tagalog', 'TL'), L('Tahitian', 'TY', 'Reo Tahiti'),
  L('Tajik', 'TG', 'Тоҷикӣ'), L('Tamil', 'TA', 'தமிழ்'), L('Tatar', 'TT', 'Татар'), L('Telugu', 'TE', 'తెలుగు'),
  L('Thai', 'TH', 'ไทย'), L('Tibetan', 'BO', 'བོད་ཡིག'), L('Tigrinya', 'TI', 'ትግርኛ'), L('Tongan', 'TO', 'Lea faka-Tonga'),
  L('Tsonga', 'TS', 'Xitsonga'), L('Tswana', 'TN', 'Setswana'), L('Turkish', 'TR', 'Türkçe'), L('Turkmen', 'TK', 'Türkmençe'),
  L('Twi', 'TW'), L('Ukrainian', 'UK', 'Українська'), L('Urdu', 'UR', 'اردو'), L('Uyghur', 'UG', 'ئۇيغۇرچە'),
  L('Uzbek', 'UZ', 'Oʻzbek'), L('Venda', 'VE', 'Tshivenḓa'), L('Vietnamese', 'VI', 'Tiếng Việt'), L('Volapük', 'VO'),
  L('Walloon', 'WA', 'Walon'), L('Welsh', 'CY', 'Cymraeg'), L('Western Frisian', 'FY', 'Frysk'), L('Wolof', 'WO'),
  L('Xhosa', 'XH', 'isiXhosa'), L('Yiddish', 'YI', 'ייִדיש'), L('Yoruba', 'YO', 'Yorùbá'), L('Zhuang', 'ZA', 'Saɯ cueŋƅ'),
  L('Zulu', 'ZU', 'isiZulu'),
];

/** Shown first, before anyone types: the languages most often spoken around London. */
export const POPULAR_LANGUAGES = [
  'English', 'Turkish', 'Polish', 'Romanian', 'Spanish', 'Arabic', 'Portuguese', 'Italian', 'French', 'Bengali',
  'Urdu', 'Punjabi', 'Hindi', 'Gujarati', 'Tamil', 'Chinese', 'Somali', 'Persian', 'Kurdish', 'Greek',
  'Russian', 'Ukrainian', 'Bulgarian', 'Lithuanian', 'German',
];

const BY_NAME = new Map(ALL_LANGUAGES.map((l) => [l.name, l]));

export const findLanguage = (name: string) => BY_NAME.get(name);

/** Short code shown next to a language, e.g. "TR" for Turkish. */
export const langCode = (name: string) => BY_NAME.get(name)?.code ?? name.slice(0, 2).toUpperCase();

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const INDEX = ALL_LANGUAGES.map((l) => ({ l, name: fold(l.name), native: l.native ? fold(l.native) : '', code: l.code.toLowerCase() }));

/** Languages matching what someone typed, by English name, native name or code. Best matches first. */
export function searchLanguages(query: string): Language[] {
  const q = fold(query);
  if (!q) return [];
  const scored: { l: Language; score: number }[] = [];
  for (const x of INDEX) {
    let score = -1;
    if (x.name === q || x.code === q) score = 0;
    else if (x.name.startsWith(q)) score = 1;
    else if (x.native.startsWith(q) || x.name.split(/[\s-]/).some((w) => w.startsWith(q))) score = 2;
    else if (x.name.includes(q) || x.native.includes(q)) score = 3;
    if (score >= 0) scored.push({ l: x.l, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.l.name.localeCompare(b.l.name)).map((x) => x.l);
}
