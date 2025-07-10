
const dropArea = document.getElementById('drop-area');
const treeOutput = document.getElementById('tree-output');
const showFilesCheckbox = document.getElementById('show-files');

let treeData = null;

dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.classList.add('hover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('hover');
});

dropArea.addEventListener('drop', async e => {
    e.preventDefault();
    dropArea.classList.remove('hover');

    // 清空旧内容
    treeOutput.textContent = '';
    treeData = null;

    const items = e.dataTransfer.items;

    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();

        if (entry && entry.isDirectory) {
            const rootName = `${entry.name}/`;
            const subtree = await generateTree(entry);
            const rootStructure = [{ name: rootName, type: 'dir', children: subtree }];
            treeData = rootStructure;
            const output = formatTree(treeData, '', showFilesCheckbox.checked, true); // 注意传入 isRoot = true
            treeOutput.textContent = output;
            return;
        } else if (items[i].kind === 'file') {
            alert('请拖入整个文件夹，而非单个文件。');
            return;
        }
    }
});

async function generateTree(entry, path = '') {
    const dirReader = entry.createReader();
    const entries = [];

    const readEntries = async () => {
        return new Promise(resolve => {
            dirReader.readEntries(results => {
                resolve([...results]);
            });
        });
    };

    let contents = await readEntries();

    while (contents.length > 0) {
        for (const item of contents) {
            if (item.isDirectory) {
                const subtree = await generateTree(item, `${path}/${item.name}`);
                entries.push({ name: `${item.name}/`, type: 'dir', children: subtree });
            } else if (item.isFile) {
                entries.push({ name: item.name, type: 'file' });
            }
        }
        contents = await readEntries();
    }

    return entries;
}

function formatTree(tree, indent, showFiles, isRoot = false) {
    let result = '';
    const len = tree.length;

    tree.forEach((node, index) => {
        const isLast = index === len - 1;

        let prefix = '';
        if (!isRoot) {
            prefix = isLast ? '└── ' : '├── ';
        }

        if (node.type === 'file' && !showFiles) return;

        if (isRoot) {
            result += `${node.name}\n`;
        } else {
            result += `${indent}${prefix}${node.name}\n`;
        }

        const childIndent = isRoot ? '' : indent + (isLast ? '    ' : '│   ');

        if (node.type === 'dir' && node.children) {
            const subTree = formatTree(node.children, childIndent, showFiles);
            result += subTree;
        }
    });

    return result;
}

showFilesCheckbox.addEventListener('change', () => {
    if (!treeData) return;
    const output = formatTree(treeData, '', showFilesCheckbox.checked, true);
    treeOutput.textContent = output;
});

async function copyToClipboard() {
    await navigator.clipboard.writeText(treeOutput.textContent);
}