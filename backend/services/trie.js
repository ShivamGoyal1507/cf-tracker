class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (let ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEndOfWord = true;
  }

  search(prefix) {
    let node = this.root;
    for (let ch of prefix) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }

    const results = [];

    const dfs = (n, path) => {
      if (results.length >= 10) return;
      if (n.isEndOfWord) results.push(path);
      for (let ch in n.children) {
        dfs(n.children[ch], path + ch);
      }
    };

    dfs(node, prefix);
    return results;
  }
}

// Init once with handles
const handles = ['tourist', 'tony_stark', 'thelegend27', 'testuser1', 'testuser2'];
global.handleTrie = new Trie();
handles.forEach(h => global.handleTrie.insert(h.toLowerCase()));

// Then:
router.get('/search', (req, res) => {
  const prefix = req.query.prefix || '';
  if (!prefix || !global.handleTrie) return res.json([]);
  const matches = global.handleTrie.search(prefix.toLowerCase());
  res.json(matches.slice(0, 10));
});