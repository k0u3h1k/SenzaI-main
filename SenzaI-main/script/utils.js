/**
 * SenzaI - Shared Utilities
 * Author: Abhidatta Benda
 * 
 * Contains global constants and utility functions used across the app.
 */

const HANDLED_INTERNALLY = Symbol('handled');

/**
 * The official list of supported themes.
 * These correspond to class names like 'dark-mode', 'dracula-mode', etc.
 */
const THEMES = [
    'light', 'dark', 'black', 'nord', 'gruvbox', 'tokyo-night', 'dracula', 'kanagawa',
    'catppuccin-frappe', 'catppuccin-macchiato', 'catppuccin-mocha',
    'rose-pine', 'rose-pine-moon', 'rose-pine-dawn', 'everforest', 'everforest-light',
    'one-dark', 'cyberpunk'
];

/**
 * Resets search-related styles on an array of elements.
 */
function resetStyles(elements) {
    elements.forEach(el => {
        el.classList.remove("bookmark-match", "bookmark-nomatch", "primary-match");
        el.style.mixBlendMode = "";
    });
}

/**
 * Returns a function that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Safely parses and evaluates basic mathematical expressions.
 * Compliant with MV3 CSP rules (no eval() or new Function()).
 */
function safeEval(str) {
  try {
    const clean = str.replace(/\s+/g, '');
    if (!/^[0-9+\-*/().%]+$/.test(clean)) return null;
    return parseArithmetic(clean);
  } catch {
    return null;
  }
}

function parseArithmetic(str) {
  let pos = 0;
  
  function tokenize() {
    const tokens = [];
    const len = str.length;
    while (pos < len) {
      const char = str[pos];
      if (/[0-9.]/.test(char)) {
        let numStr = "";
        while (pos < len && /[0-9.]/.test(str[pos])) {
          numStr += str[pos];
          pos++;
        }
        tokens.push({ type: 'NUM', value: parseFloat(numStr) });
      } else if ('+-*/()%'.includes(char)) {
        tokens.push({ type: char });
        pos++;
      } else {
        throw new Error("Invalid character");
      }
    }
    return tokens;
  }

  const tokens = tokenize();
  let tokenIdx = 0;

  function peek() { return tokens[tokenIdx]; }
  function consume(type) {
    const t = peek();
    if (!t || (type && t.type !== type)) throw new Error("Unexpected token");
    tokenIdx++;
    return t;
  }

  function parseExpression() {
    let node = parseTerm();
    let token = peek();
    while (token && (token.type === '+' || token.type === '-')) {
      const op = consume().type;
      const right = parseTerm();
      node = { type: 'BINARY', op, left: node, right };
      token = peek();
    }
    return node;
  }

  function parseTerm() {
    let node = parseFactor();
    let token = peek();
    while (token && (token.type === '*' || token.type === '/' || token.type === '%')) {
      const op = consume().type;
      const right = parseFactor();
      node = { type: 'BINARY', op, left: node, right };
      token = peek();
    }
    return node;
  }

  function parseFactor() {
    const token = peek();
    if (!token) throw new Error("Unexpected end of input");
    
    if (token.type === 'NUM') {
      return consume();
    }
    
    if (token.type === '(') {
      consume('(');
      const expr = parseExpression();
      consume(')');
      return expr;
    }
    
    if (token.type === '-') {
      consume('-');
      const factor = parseFactor();
      return { type: 'UNARY', op: '-', expr: factor };
    }
    
    if (token.type === '+') {
      consume('+');
      return parseFactor();
    }
    
    throw new Error("Unexpected token type");
  }

  const ast = parseExpression();
  if (tokenIdx < tokens.length) throw new Error("Trailing characters");

  function evaluateNode(node) {
    if (node.type === 'NUM') return node.value;
    if (node.type === 'UNARY') {
      const val = evaluateNode(node.expr);
      return node.op === '-' ? -val : val;
    }
    if (node.type === 'BINARY') {
      const left = evaluateNode(node.left);
      const right = evaluateNode(node.right);
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': 
          if (right === 0) throw new Error("Divide by zero");
          return left / right;
        case '%': return left % right;
      }
    }
    throw new Error("Unknown node type");
  }

  return evaluateNode(ast);
}
