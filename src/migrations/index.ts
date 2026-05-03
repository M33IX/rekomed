import * as migration_20260430_101644_init from './20260430_101644_init';
import * as migration_20260501_104500_category_hierarchy from './20260501_104500_category_hierarchy';
import * as migration_20260502_173000_site_settings_seo_legal from './20260502_173000_site_settings_seo_legal';
import * as migration_20260503_091500_editable_legal_texts from './20260503_091500_editable_legal_texts';

export const migrations = [
  {
    up: migration_20260430_101644_init.up,
    down: migration_20260430_101644_init.down,
    name: '20260430_101644_init',
  },
  {
    up: migration_20260501_104500_category_hierarchy.up,
    down: migration_20260501_104500_category_hierarchy.down,
    name: '20260501_104500_category_hierarchy',
  },
  {
    up: migration_20260502_173000_site_settings_seo_legal.up,
    down: migration_20260502_173000_site_settings_seo_legal.down,
    name: '20260502_173000_site_settings_seo_legal',
  },
  {
    up: migration_20260503_091500_editable_legal_texts.up,
    down: migration_20260503_091500_editable_legal_texts.down,
    name: '20260503_091500_editable_legal_texts',
  }
];
