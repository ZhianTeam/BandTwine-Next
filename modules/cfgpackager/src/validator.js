/*
 * File: src/validator.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * This is the converter for BandTwine Next to squash original KDL configuration file to a minimized binary format.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import { ValidationError, ValidationWarning } from './errors.js';

// SemVer Verification
function isValidSemver(str) {
  return /^\d+\.\d+\.\d+$/.test(str);
}

// Date
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

// SPDX Licenses
const KNOWN_LICENSES = new Set([
  'MIT', 'Apache-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0',
  'AGPL-3.0', 'MPL-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'CC0-1.0',
  'CC-0', 'CC-BY-SA-4.0', 'ISC', 'Unlicense', 'WTFPL', 'Proprietary'
]);

function getArgValue(node) {
  if (node.arguments.length === 0) return undefined;
  return node.arguments[0].value;
}

function getAllArgValues(node) {
  return node.arguments.map(a => a.value);
}

function findChild(node, name) {
  return (node.children || []).find(
    c => !c.disabled && c.name === name
  );
}

function findChildren(node, name) {
  return (node.children || []).filter(
    c => !c.disabled && c.name === name
  );
}

// Verify `meta` block
function validateMeta(metaNode, errors, warnings) {
  const meta = {
    name: null,
    description: null,
    authors: [],
    version: {
      id: null,
      code: null,
      immutable: false
    },
    release: null,
    licenses: [],
    copyright: {
      copyrighted: false,
      owner: null,
      containsNonFreeAssets: false
    }
  };

  // required: name
  const nameNode = findChild(metaNode, 'name');
  if (!nameNode) {
    errors.push(new ValidationError(
      "meta: missing required field 'name'",
      metaNode.line, metaNode.column
    ));
  } else {
    const v = getArgValue(nameNode);
    if (typeof v !== 'string' || v.trim() === '') {
      errors.push(new ValidationError(
        "meta.name: must be a non-empty string",
        nameNode.line, nameNode.column
      ));
    } else {
      meta.name = v;
    }
  }

  // optional: description
  const descNode = findChild(metaNode, 'description');
  if (descNode) {
    const v = getArgValue(descNode);
    if (typeof v !== 'string') {
      errors.push(new ValidationError(
        "meta.description: must be a string",
        descNode.line, descNode.column
      ));
    } else {
      meta.description = v;
    }
  }

  // multiple value - optional: author
  const authorNode = findChild(metaNode, 'author');
  if (authorNode) {
    const vals = getAllArgValues(authorNode);
    if (vals.length === 0) {
      warnings.push(new ValidationWarning(
        "meta.author: node present but no authors specified",
        authorNode.line, authorNode.column
      ));
    }
    for (const v of vals) {
      if (typeof v !== 'string') {
        errors.push(new ValidationError(
          `meta.author: each author must be a string, got ${typeof v}`,
          authorNode.line, authorNode.column
        ));
      } else {
        meta.authors.push(v);
      }
    }
  }

  // optional but recommended: ver
  const verNode = findChild(metaNode, 'ver');
  if (!verNode) {
    warnings.push(new ValidationWarning(
      "meta: missing 'ver' block; version information will be absent",
      metaNode.line, metaNode.column
    ));
  } else {
    meta.version.immutable = !!findChild(verNode, 'immutable');

    const idNode = findChild(verNode, 'id');
    if (!idNode) {
      errors.push(new ValidationError(
        "meta.ver: missing required field 'id'",
        verNode.line, verNode.column
      ));
    } else {
      const v = getArgValue(idNode);
      if (typeof v !== 'string') {
        errors.push(new ValidationError(
          "meta.ver.id: must be a string (semver recommended)",
          idNode.line, idNode.column
        ));
      } else {
        if (!isValidSemver(v)) {
          warnings.push(new ValidationWarning(
            `meta.ver.id: '${v}' does not follow semver format (X.Y.Z)`,
            idNode.line, idNode.column
          ));
        }
        meta.version.id = v;
      }
    }

    const codeNode = findChild(verNode, 'code');
    if (!codeNode) {
      errors.push(new ValidationError(
        "meta.ver: missing required field 'code'",
        verNode.line, verNode.column
      ));
    } else {
      const v = getArgValue(codeNode);
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
        errors.push(new ValidationError(
          "meta.ver.code: must be a non-negative integer",
          codeNode.line, codeNode.column
        ));
      } else {
        meta.version.code = v;
      }
    }
  }

  // optional: release date
  const releaseNode = findChild(metaNode, 'release');
  if (releaseNode) {
    const v = getArgValue(releaseNode);
    if (typeof v !== 'string') {
      errors.push(new ValidationError(
        "meta.release: expected a date string in format YYYY-MM-DD",
        releaseNode.line, releaseNode.column
      ));
    } else if (!isValidDate(v)) {
      errors.push(new ValidationError(
        `meta.release: '${v}' is not a valid date (expected YYYY-MM-DD)`,
        releaseNode.line, releaseNode.column
      ));
    } else {
      meta.release = v;
    }
  }

  // multiple value: license
  const licenseNode = findChild(metaNode, 'license');
  if (licenseNode) {
    const vals = getAllArgValues(licenseNode);
    for (const v of vals) {
      if (typeof v !== 'string') {
        errors.push(new ValidationError(
          "meta.license: each license must be a string",
          licenseNode.line, licenseNode.column
        ));
      } else {
        if (!KNOWN_LICENSES.has(v)) {
          warnings.push(new ValidationWarning(
            `meta.license: '${v}' is not a recognized SPDX identifier`,
            licenseNode.line, licenseNode.column
          ));
        }
        meta.licenses.push(v);
      }
    }
  }

  // copyright 块
  const copyrightNode = findChild(metaNode, 'copyright');
  if (copyrightNode) {
    meta.copyright.copyrighted = !!findChild(copyrightNode, 'copyrighted');
    meta.copyright.containsNonFreeAssets = !!findChild(copyrightNode, 'containsNonFreeAssets');

    const ownerNode = findChild(copyrightNode, 'owner');
    if (ownerNode) {
      const v = getArgValue(ownerNode);
      if (typeof v !== 'string') {
        errors.push(new ValidationError(
          "meta.copyright.owner: must be a string",
          ownerNode.line, ownerNode.column
        ));
      } else {
        meta.copyright.owner = v;
      }
    }

    if (meta.copyright.copyrighted && !meta.copyright.owner) {
      warnings.push(new ValidationWarning(
        "meta.copyright:'copyrighted' is set but no 'owner' is specified",
        copyrightNode.line, copyrightNode.column
      ));
    }
  }

  // 检测 meta 内未识别的顶级子节点
  const KNOWN_META_CHILDREN = new Set([
    'name', 'description', 'author', 'ver', 'release', 'license', 'copyright'
  ]);
  for (const child of (metaNode.children || [])) {
    if (child.disabled) continue;
    if (!KNOWN_META_CHILDREN.has(child.name)) {
      warnings.push(new ValidationWarning(
        `meta: unknown field '${child.name}' will be ignored`,
        child.line, child.column
      ));
    }
  }

  return meta;
}

// Environment Validator
// 独立节点（无参数）= null；带参数 = 设为默认值
function validateEnv(envNode, errors, warnings) {
  const env = {};

  for (const nsNode of (envNode.children || [])) {
    if (nsNode.disabled) continue;

    const ns = nsNode.name;

    // 命名空间节点不应携带参数或属性
    if (nsNode.arguments.length > 0) {
      warnings.push(new ValidationWarning(
        `env.${ns}: namespace node should not have arguments; they will be ignored`,
        nsNode.line, nsNode.column
      ));
    }
    if (nsNode.properties.length > 0) {
      warnings.push(new ValidationWarning(
        `env.${ns}: namespace node should not have properties; they will be ignored`,
        nsNode.line, nsNode.column
      ));
    }
    if (nsNode.children.length === 0) {
      warnings.push(new ValidationWarning(
        `env.${ns}: empty namespace`,
        nsNode.line, nsNode.column
      ));
    }

    env[ns] = {};

    for (const varNode of (nsNode.children || [])) {
      if (varNode.disabled) continue;

      const varName = varNode.name;

      // 变量节点不应有子节点
      if (varNode.children.length > 0) {
        errors.push(new ValidationError(
          `env.${ns}.${varName}: variable declaration must not have a children block`,
          varNode.line, varNode.column
        ));continue;
      }

      // 变量不应有属性赋值
      if (varNode.properties.length > 0) {
        errors.push(new ValidationError(
          `env.${ns}.${varName}: variable declaration must not have properties`,
          varNode.line, varNode.column
        ));
        continue;
      }

      // 最多一个默认值参数
      if (varNode.arguments.length > 1) {
        errors.push(new ValidationError(
          `env.${ns}.${varName}: variable must have at most one default value`,
          varNode.line, varNode.column
        ));
        continue;
      }

      const defaultValue = varNode.arguments.length === 1
        ? varNode.arguments[0].value
        : null;

      // 校验默认值类型
      if (defaultValue !== null) {
        const t = typeof defaultValue;
        if (t !== 'string' && t !== 'number' && t !== 'boolean') {
          errors.push(new ValidationError(
            `env.${ns}.${varName}: default value must be string, number, or boolean`,
            varNode.line, varNode.column
          ));
          continue;
        }
      }

      env[ns][varName] = defaultValue;
    }
  }

  return env;
}

// Properties Validator
function validateProperties(propsNode, errors, warnings) {
  const properties = {};

  //顶层属性通过子节点携带
  for (const child of (propsNode.children || [])) {
    if (child.disabled) continue;

    if (child.arguments.length === 0) {
      warnings.push(new ValidationWarning(
        `properties.${child.name}: no value specified`,
        child.line, child.column
      ));properties[child.name] = null;continue;
    }

    if (child.arguments.length > 1) {
      errors.push(new ValidationError(
        `properties.${child.name}: must have exactly one value`,
        child.line, child.column
      ));
      continue;
    }

    properties[child.name] = child.arguments[0].value;
  }

  // 也支持 properties 节点自身携带属性赋值
  for (const prop of (propsNode.properties || [])) {
    properties[prop.name] = prop.value.value;
  }

  // startNode 必填校验
  if (!Object.prototype.hasOwnProperty.call(properties, 'startNode')) {
    errors.push(new ValidationError(
      "properties: missing required field 'startNode'",
      propsNode.line, propsNode.column
    ));
  } else if (typeof properties.startNode !== 'string' || properties.startNode.trim() === '') {
    errors.push(new ValidationError(
      "properties.startNode: must be a non-empty string",
      propsNode.line, propsNode.column
    ));
  }

  return properties;
}

export function validate(ast) {
  const errors = [];
  const warnings = [];
  const data = {};

  // 从顶级节点（忽略 disabled）开始
  const rootNodes = ast.children.filter(n => !n.disabled);

  // 重复节点检测
  const seen = {};
  for (const node of rootNodes) {
    if (seen[node.name]) {
      errors.push(new ValidationError(
        `Duplicate top-level node '${node.name}' (first defined at line ${seen[node.name]})`,
        node.line, node.column
      ));
    } else {
      seen[node.name] = node.line;
    }
  }

  // meta
  const metaNode = rootNodes.find(n => n.name === 'meta');
  if (!metaNode) {
    errors.push(new ValidationError(
      "Missing required top-level node 'meta'",
      1, 1
    ));
  } else {
    data.meta = validateMeta(metaNode, errors, warnings);
  }

  // env
  const envNode = rootNodes.find(n => n.name === 'env');
  if (!envNode) {
    warnings.push(new ValidationWarning(
      "Missing 'env' block; no initial variables will be defined",
      1, 1
    ));
    data.env = {};
  } else {
    data.env = validateEnv(envNode, errors, warnings);
  }

  // properties
  const propsNode = rootNodes.find(n => n.name === 'properties');
  if (!propsNode) {
    errors.push(new ValidationError(
      "Missing required top-level node 'properties'",
      1, 1
    ));
    data.properties = {};
  } else {
    data.properties = validateProperties(propsNode, errors, warnings);
  }

  // 未识别的顶级节点
  const KNOWN_ROOT = new Set(['meta', 'env', 'properties']);
  for (const node of rootNodes) {
    if (!KNOWN_ROOT.has(node.name)) {
      warnings.push(new ValidationWarning(
        `Unknown top-level node '${node.name}' will be ignored`,
        node.line, node.column
      ));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data
  };
}
