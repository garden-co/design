import {jsx} from 'react/jsx-runtime';
import {Text} from '@astryxdesign/core/Text';

/**
 * Small uppercase section label ("JAZZ CLOUD"). Renders Astryx `Text` with the
 * theme's custom `eyebrow` type, which Astryx 0.6 styles but cannot add to
 * `TextType` (text types are a closed union, not an augmentable interface).
 */
export function Eyebrow({as = 'p', ...props}) {
  return jsx(Text, {...props, as, display: 'block', type: 'eyebrow'});
}
