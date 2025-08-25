# MCP Server Setup Guide for Phoenix Web

## ✅ Configured MCP Servers

### 1. **Filesystem Server** (`@modelcontextprotocol/server-filesystem`)
- **Purpose**: Enhanced file operations across your Development folder
- **Access**: All files in `/Users/welshofer/Development`
- **Use Cases**:
  - Bulk file operations
  - Project-wide searches
  - File structure analysis
  - Cross-project file management

### 2. **Git Server** (`@cyanheads/git-mcp-server`)
- **Purpose**: Version control operations
- **Repository**: `/Users/welshofer/Development/phoenix-web/app`
- **Use Cases**:
  - Commit management
  - Branch operations
  - History analysis
  - Diff viewing

### 3. **Memory Server** (`@modelcontextprotocol/server-memory`)
- **Purpose**: Persistent memory across conversations
- **Use Cases**:
  - Remember project context
  - Store frequently used commands
  - Track ongoing tasks
  - Save configuration snippets

### 4. **Sequential Thinking Server** (`@modelcontextprotocol/server-sequential-thinking`)
- **Purpose**: Break down complex problems
- **Use Cases**:
  - Architecture planning
  - Debugging complex issues
  - Step-by-step implementation
  - Problem decomposition

## 🚀 How to Use

1. **Restart Claude Desktop** (Required for changes to take effect)
2. After restart, you'll see new MCP tools in the tool palette
3. The tools will appear with prefixes like `mcp__filesystem_`, `mcp__git_`, etc.

## 📝 Common Commands

### For Filesystem Operations
```
mcp__filesystem_read_file
mcp__filesystem_write_file
mcp__filesystem_list_directory
mcp__filesystem_search
```

### For Git Operations
```
mcp__git_status
mcp__git_commit
mcp__git_branch
mcp__git_log
```

### For Memory Operations
```
mcp__memory_store
mcp__memory_retrieve
mcp__memory_list
```

## 🔧 Troubleshooting

### If MCP servers don't appear:
1. Check Claude Desktop is fully closed and restarted
2. Verify the config file at: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Check for errors in Claude Desktop's developer console (View > Developer > Developer Tools)

### To test a server manually:
```bash
# Test filesystem server
npx -y @modelcontextprotocol/server-filesystem /tmp

# Test git server  
npx -y @cyanheads/git-mcp-server --path .

# Test memory server
npx -y @modelcontextprotocol/server-memory
```

## 🎯 Benefits for Swift Developers

Coming from Swift/iOS development, these MCP servers provide:

1. **Type-safe operations** - Similar to Swift's type safety
2. **Git integration** - Like Xcode's source control
3. **Memory persistence** - Like UserDefaults/CoreData
4. **Filesystem access** - Like FileManager in iOS

## 🔮 Future Enhancements

Consider adding these MCP servers as they become available:

1. **Firebase MCP** - Direct Firebase operations
2. **Google Cloud MCP** - Vertex AI and GCP management
3. **TypeScript MCP** - Enhanced TypeScript support
4. **Testing MCP** - Jest/Cypress integration
5. **Docker MCP** - Container management

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.org)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [Community MCP Servers](https://github.com/topics/mcp-server)

## 💡 Tips

1. Use filesystem MCP for project-wide refactoring
2. Use git MCP for complex merge operations
3. Use memory MCP to track TODO items and context
4. Combine multiple MCP tools for complex operations

---

**Note**: After restarting Claude Desktop, the MCP tools will be available with `mcp__` prefix in the tool selection.