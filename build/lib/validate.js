'use strict';

/**
 * Schema validation for generated content data.
 *
 * Content under build/data/ is machine-authored, so the build validates it rather than
 * trusting it: a missing key or a stray HTML tag becomes a loud build failure instead of
 * a silently broken page.
 */

const HTML_TAG = /<\/?[a-z][\s\S]*?>/i;
const MARKDOWN = /(\*\*|`|^\s*#{1,6}\s|\[[^\]]+\]\([^)]+\))/m;
const ENTITY = /&(amp|lt|gt|quot|#\d+|nbsp);/i;

/** Walk every string in a value, reporting the JSON path of each. */
function walkStrings(value, path, fn) {
  if (typeof value === 'string') {
    fn(value, path);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, fn));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => walkStrings(value[k], `${path}.${k}`, fn));
  }
}

/** Shared text-hygiene rules applied to every content file. */
function checkText(data, file, errors) {
  walkStrings(data, file, (str, path) => {
    if (HTML_TAG.test(str)) errors.push(`${path}: contains an HTML tag`);
    if (MARKDOWN.test(str)) errors.push(`${path}: contains markdown syntax`);
    if (ENTITY.test(str)) errors.push(`${path}: contains an HTML entity (write plain characters)`);
  });
}

function requireKeys(obj, keys, file, errors, prefix) {
  keys.forEach((k) => {
    if (obj[k] === undefined || obj[k] === null || obj[k] === '') {
      errors.push(`${file}: missing required key "${prefix ? prefix + '.' : ''}${k}"`);
    }
  });
}

function requireCount(arr, n, label, file, errors) {
  if (!Array.isArray(arr)) {
    errors.push(`${file}: "${label}" must be an array`);
  } else if (arr.length !== n) {
    errors.push(`${file}: "${label}" must have exactly ${n} items, found ${arr.length}`);
  }
}

/** Validate one service content file. */
function validateService(data, file, validSlugs) {
  const errors = [];

  requireKeys(
    data,
    [
      'slug', 'name', 'shortName', 'category', 'metaTitle', 'metaDescription',
      'cardSummary', 'heroHeadline', 'heroSub', 'highlights', 'intro',
      'capabilities', 'deliverables', 'process', 'benefits', 'whoItsFor', 'faqs', 'related',
    ],
    file,
    errors
  );

  if (data.intro) {
    requireKeys(data.intro, ['heading', 'paragraphs'], file, errors, 'intro');
    requireCount(data.intro.paragraphs, 3, 'intro.paragraphs', file, errors);
  }
  if (data.capabilities) {
    requireKeys(data.capabilities, ['heading', 'items'], file, errors, 'capabilities');
    requireCount(data.capabilities.items, 6, 'capabilities.items', file, errors);
    (data.capabilities.items || []).forEach((it, i) =>
      requireKeys(it, ['title', 'description'], file, errors, `capabilities.items[${i}]`)
    );
  }
  if (data.deliverables) {
    requireKeys(data.deliverables, ['heading', 'intro', 'items'], file, errors, 'deliverables');
    requireCount(data.deliverables.items, 8, 'deliverables.items', file, errors);
  }

  requireCount(data.highlights, 3, 'highlights', file, errors);
  requireCount(data.process, 4, 'process', file, errors);
  requireCount(data.benefits, 4, 'benefits', file, errors);
  requireCount(data.whoItsFor, 4, 'whoItsFor', file, errors);
  requireCount(data.faqs, 5, 'faqs', file, errors);
  requireCount(data.related, 3, 'related', file, errors);

  (data.highlights || []).forEach((h, i) =>
    requireKeys(h, ['value', 'label'], file, errors, `highlights[${i}]`)
  );
  (data.process || []).forEach((p, i) =>
    requireKeys(p, ['title', 'description'], file, errors, `process[${i}]`)
  );
  (data.benefits || []).forEach((b, i) =>
    requireKeys(b, ['title', 'description'], file, errors, `benefits[${i}]`)
  );
  (data.faqs || []).forEach((f, i) =>
    requireKeys(f, ['question', 'answer'], file, errors, `faqs[${i}]`)
  );

  (data.related || []).forEach((slug) => {
    if (!validSlugs.includes(slug)) errors.push(`${file}: related slug "${slug}" is not a known service`);
    if (slug === data.slug) errors.push(`${file}: related must not include its own slug`);
  });

  if (data.metaDescription && data.metaDescription.length > 175) {
    errors.push(`${file}: metaDescription is ${data.metaDescription.length} chars (max 175)`);
  }

  checkText(data, file, errors);
  return errors;
}

/** Validate one academy programme file. */
function validateProgramme(data, file, validSlugs) {
  const errors = [];

  requireKeys(
    data,
    [
      'slug', 'name', 'shortName', 'category', 'format', 'duration', 'level',
      'metaTitle', 'metaDescription', 'cardSummary', 'heroHeadline', 'heroSub',
      'highlights', 'intro', 'outcomes', 'modules', 'delivery', 'benefits',
      'whoItsFor', 'faqs', 'related',
    ],
    file,
    errors
  );

  if (data.intro) {
    requireKeys(data.intro, ['heading', 'paragraphs'], file, errors, 'intro');
    requireCount(data.intro.paragraphs, 3, 'intro.paragraphs', file, errors);
  }
  if (data.outcomes) {
    requireKeys(data.outcomes, ['heading', 'intro', 'items'], file, errors, 'outcomes');
    requireCount(data.outcomes.items, 7, 'outcomes.items', file, errors);
  }
  if (data.modules) {
    requireKeys(data.modules, ['heading', 'items'], file, errors, 'modules');
    requireCount(data.modules.items, 6, 'modules.items', file, errors);
    (data.modules.items || []).forEach((it, i) =>
      requireKeys(it, ['title', 'description'], file, errors, `modules.items[${i}]`)
    );
  }

  requireCount(data.highlights, 3, 'highlights', file, errors);
  requireCount(data.delivery, 4, 'delivery', file, errors);
  requireCount(data.benefits, 4, 'benefits', file, errors);
  requireCount(data.whoItsFor, 4, 'whoItsFor', file, errors);
  requireCount(data.faqs, 4, 'faqs', file, errors);
  requireCount(data.related, 3, 'related', file, errors);

  (data.highlights || []).forEach((h, i) =>
    requireKeys(h, ['value', 'label'], file, errors, `highlights[${i}]`)
  );
  (data.delivery || []).forEach((d, i) =>
    requireKeys(d, ['title', 'description'], file, errors, `delivery[${i}]`)
  );
  (data.benefits || []).forEach((b, i) =>
    requireKeys(b, ['title', 'description'], file, errors, `benefits[${i}]`)
  );
  (data.faqs || []).forEach((f, i) =>
    requireKeys(f, ['question', 'answer'], file, errors, `faqs[${i}]`)
  );

  (data.related || []).forEach((slug) => {
    if (!validSlugs.includes(slug)) errors.push(`${file}: related slug "${slug}" is not a known programme`);
    if (slug === data.slug) errors.push(`${file}: related must not include its own slug`);
  });

  if (data.metaDescription && data.metaDescription.length > 175) {
    errors.push(`${file}: metaDescription is ${data.metaDescription.length} chars (max 175)`);
  }

  checkText(data, file, errors);
  return errors;
}

/** Validate the academy home page content file. */
function validateAcademyHome(data, file) {
  const errors = [];
  requireKeys(data, ['hero', 'stats', 'intro', 'phishing', 'delivery', 'audience', 'why', 'cta'], file, errors);
  if (data.hero) requireKeys(data.hero, ['eyebrow', 'headline', 'headlineAccent', 'sub'], file, errors, 'hero');
  if (data.intro) {
    requireKeys(data.intro, ['eyebrow', 'heading', 'paragraphs', 'points'], file, errors, 'intro');
    requireCount(data.intro.paragraphs, 3, 'intro.paragraphs', file, errors);
    requireCount(data.intro.points, 4, 'intro.points', file, errors);
  }
  if (data.phishing) requireKeys(data.phishing, ['eyebrow', 'heading', 'paragraphs', 'items'], file, errors, 'phishing');
  if (data.delivery) {
    requireKeys(data.delivery, ['eyebrow', 'heading', 'sub', 'steps'], file, errors, 'delivery');
    requireCount(data.delivery.steps, 4, 'delivery.steps', file, errors);
  }
  if (data.why) {
    requireKeys(data.why, ['eyebrow', 'heading', 'sub', 'items'], file, errors, 'why');
    requireCount(data.why.items, 6, 'why.items', file, errors);
  }
  requireCount(data.stats, 4, 'stats', file, errors);
  checkText(data, file, errors);
  return errors;
}

/** Validate an academy section page (certification, for-organisations). */
function validateAcademyPage(data, file, extraKeys) {
  const errors = [];
  requireKeys(
    data,
    ['title', 'heroHeadline', 'heroSub', 'metaTitle', 'metaDescription', 'highlights', 'intro', 'faqs'].concat(
      extraKeys || []
    ),
    file,
    errors
  );
  requireCount(data.highlights, 3, 'highlights', file, errors);
  if (data.intro) requireKeys(data.intro, ['heading', 'paragraphs'], file, errors, 'intro');
  if (!Array.isArray(data.faqs) || data.faqs.length < 4) {
    errors.push(`${file}: "faqs" must have at least 4 entries`);
  }
  (data.faqs || []).forEach((f, i) => requireKeys(f, ['question', 'answer'], file, errors, `faqs[${i}]`));
  if (data.metaDescription && data.metaDescription.length > 175) {
    errors.push(`${file}: metaDescription is ${data.metaDescription.length} chars (max 175)`);
  }
  checkText(data, file, errors);
  return errors;
}

/** Validate a document-style content file (legal pages, articles). */
function validateDocument(data, file, extraKeys) {
  const errors = [];
  requireKeys(data, ['metaTitle', 'metaDescription', 'sections'].concat(extraKeys || []), file, errors);

  if (!Array.isArray(data.sections) || data.sections.length < 4) {
    errors.push(`${file}: "sections" must be an array of at least 4 sections`);
  } else {
    data.sections.forEach((s, i) => {
      requireKeys(s, ['heading', 'paragraphs'], file, errors, `sections[${i}]`);
      if (!Array.isArray(s.paragraphs) || !s.paragraphs.length) {
        errors.push(`${file}: sections[${i}].paragraphs must be a non-empty array`);
      }
      if (s.list !== undefined && (!Array.isArray(s.list) || !s.list.length)) {
        errors.push(`${file}: sections[${i}].list must be omitted or a non-empty array`);
      }
    });
  }

  if (data.metaDescription && data.metaDescription.length > 175) {
    errors.push(`${file}: metaDescription is ${data.metaDescription.length} chars (max 175)`);
  }

  checkText(data, file, errors);
  return errors;
}

/** Validate the industries content file. */
function validateIndustries(data, file) {
  const errors = [];
  requireKeys(data, ['metaTitle', 'metaDescription', 'heroHeadline', 'heroSub', 'industries'], file, errors);
  requireCount(data.industries, 8, 'industries', file, errors);
  (data.industries || []).forEach((ind, i) => {
    requireKeys(ind, ['slug', 'name', 'summary', 'challenges', 'howWeHelp', 'regulations'], file, errors, `industries[${i}]`);
    requireCount(ind.challenges, 4, `industries[${i}].challenges`, file, errors);
    requireCount(ind.howWeHelp, 4, `industries[${i}].howWeHelp`, file, errors);
    if (!Array.isArray(ind.regulations) || ind.regulations.length < 3) {
      errors.push(`${file}: industries[${i}].regulations needs at least 3 entries`);
    }
  });
  checkText(data, file, errors);
  return errors;
}

/** Validate the case studies content file. */
function validateCaseStudies(data, file, validSlugs) {
  const errors = [];
  requireKeys(data, ['metaTitle', 'metaDescription', 'heroHeadline', 'heroSub', 'disclaimer', 'caseStudies'], file, errors);
  requireCount(data.caseStudies, 6, 'caseStudies', file, errors);
  (data.caseStudies || []).forEach((cs, i) => {
    requireKeys(cs, ['slug', 'title', 'sector', 'profile', 'services', 'challenge', 'approach', 'outcome'], file, errors, `caseStudies[${i}]`);
    requireCount(cs.approach, 4, `caseStudies[${i}].approach`, file, errors);
    (cs.services || []).forEach((slug) => {
      if (!validSlugs.includes(slug)) {
        errors.push(`${file}: caseStudies[${i}] references unknown service slug "${slug}"`);
      }
    });
    // A percentage or "reduced by N" in a case study is the fabricated-metric failure mode.
    const numeric = /\b\d+(\.\d+)?\s?%/;
    [cs.challenge, cs.outcome].forEach((text) => {
      if (text && numeric.test(text)) {
        errors.push(`${file}: caseStudies[${i}] contains a percentage figure — case studies must not state measured metrics`);
      }
    });
  });
  checkText(data, file, errors);
  return errors;
}

/** Validate the careers content file. */
function validateCareers(data, file) {
  const errors = [];
  requireKeys(data, ['metaTitle', 'metaDescription', 'heroHeadline', 'heroSub', 'intro', 'culture', 'benefits', 'openRoles', 'process'], file, errors);
  if (data.intro) requireCount(data.intro.paragraphs, 3, 'intro.paragraphs', file, errors);
  requireCount(data.culture, 4, 'culture', file, errors);
  requireCount(data.benefits, 6, 'benefits', file, errors);
  requireCount(data.openRoles, 6, 'openRoles', file, errors);
  requireCount(data.process, 4, 'process', file, errors);
  (data.openRoles || []).forEach((r, i) => {
    requireKeys(r, ['slug', 'title', 'team', 'location', 'type', 'experience', 'summary', 'responsibilities', 'requirements'], file, errors, `openRoles[${i}]`);
    requireCount(r.responsibilities, 5, `openRoles[${i}].responsibilities`, file, errors);
    requireCount(r.requirements, 5, `openRoles[${i}].requirements`, file, errors);
  });
  checkText(data, file, errors);
  return errors;
}

/** Validate an insight article file. */
function validateArticle(data, file) {
  const errors = validateDocument(data, file, ['slug', 'title', 'category', 'excerpt', 'readingTime', 'keyTakeaways']);
  requireCount(data.keyTakeaways, 4, 'keyTakeaways', file, errors);
  return errors;
}

module.exports = {
  validateService,
  validateProgramme,
  validateAcademyHome,
  validateAcademyPage,
  validateDocument,
  validateIndustries,
  validateCaseStudies,
  validateCareers,
  validateArticle,
};
