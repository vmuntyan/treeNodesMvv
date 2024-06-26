var interval = Object;

$(document).ready(function () {
    loadTree();

    $('#create-root').on('click', function () {
        $.post('php/nodes.php', { action: 'create_root' }, function (response) {
            const root = JSON.parse(response);
            $('#tree-container').append(createNodeElement(root.id, 'root'));
        });
        $('#create-root').hide();
    });

    $(document).on('click', '.add-node', function () {
        const parentId = $(this).closest('.node').data('id');
        addChildNode(parentId);
    });

    $(document).on('click', '.delete-node', function () {
        const nodeId = $(this).closest('.node').data('id');
        $('#popup-message').text('This is very dangerous, you shouldn`t do it! Are you really really sure?');
        $('#confirmation-popup').modal('show').data('id', nodeId);
        startCountdown(20, nodeId);
    });

    $('#cancel-delete').on('click', function () {
        stopCountdown();
        $('#confirmation-popup').modal('hide');
    });

    $('#confirm-delete').on('click', function () {
        stopCountdown();
        deleteNode($('#confirmation-popup').data('id'));
        $('#confirmation-popup').modal('hide');
    });

    $(document).on('click', '.edit-node', function () {
        const nodeId = $(this).closest('.node').data('id');
        const node = $(`[data-id=${nodeId}]`);
        const label = node.find('.node-label').first();
        const editor = node.find('.node-editor').first();

        label.hide();
        editor.show().find('input').focus().val(label.text());
    });

    $(document).on('click', '.save-edit', function () {
        const nodeId = $(this).closest('.node').data('id');
        const editor = $(this).closest('.node-editor');
        const newName = editor.find('input').first().val();
        const label = editor.siblings('.node-label');

        saveName(nodeId, newName, () => { label.text(newName); });

        editor.hide();
        label.show();

    });

    $(document).on('click', '.cancel-edit', function () {
        const editor = $(this).closest('.node-editor');
        const label = editor.siblings('.node-label');

        editor.hide();
        label.show();
    });

    $(document).on('click', '.expand-node', function () {
        const node = $(this).closest('.node');
        const children = node.children('.children');
        const isExpanded = children.is(':visible');
        children.toggle(!isExpanded);
        $(this).toggleClass('expanded', !isExpanded);
        $(this).html(isExpanded ? '►' : '▼');

    });

    function saveName(nodeId, newName, callBack) {
        if (newName !== '') {
            $.post('php/nodes.php', { action: 'edit_node', id: nodeId, name: newName }, function () {
                callBack();
            });
        }
    }

    function addChildNode(parentId) {
        const parentNode = $(`[data-id=${parentId}]`);
        const nodeName = parentNode.find('.node-label').first().text();
        const childrenContainer = parentNode.children('.children');
        const childName = nodeName + ' ' + (childrenContainer.children('.node').length + 1);

        $.post('php/nodes.php', { action: 'add_node', parent_id: parentId, name_node: childName }, function (response) {
            const newNode = JSON.parse(response);
            const nodeElement = createNodeElement(newNode.id, newNode.name, newNode.hasChildren, newNode.expanded);
            childrenContainer.append(nodeElement);
            const expandButton = parentNode.find('.expand-node');
            if (!expandButton.length) {
                parentNode.prepend('<button class="expand-node btn">►</button>');
            }
            updateExpandButtons();
        });
    }

    function createNodeElement(id, name, hasChildren, expanded) {
        return `<div class="node" data-id="${id}">
                    ${hasChildren ? `<span class="actions">
                        <button class="expand-node btn ${expanded ? 'expanded' : ''}">${expanded ? '▼' : '►'}</button>
                    </span>` : ''}
                    <span class="node-label">${name}</span>
                    <span class="node-editor">
                        <input type="text" class="form-control" value="${name}" />
                        <button class="save-edit btn btn-primary">Save</button>
                        <button class="cancel-edit btn btn-secondary">Cancel</button>
                    </span>
                    <span class="actions">
                        <button class="add-node btn btn-success">+</button>
                        <button class="delete-node btn btn-danger">-</button>
                        <button class="edit-node btn btn-info">Edit</button>
                    </span>
                    <div class="children"></div>
                </div>`;
    }

    function updateExpandButtons() {
        $('.node').each(function () {
            const children = $(this).children('.children');
            const expandButton = $(this).find('.expand-node');
            const hasChildren = children.children().length > 0;
            expandButton.toggle(hasChildren);
            if (hasChildren) {
                const isExpanded = children.is(':visible');
                expandButton.toggleClass('expanded', isExpanded);
                expandButton.html(isExpanded ? '▼' : '►');
            }
        });
    }


    function loadTree() {
        $.post('php/nodes.php', { action: 'get_nodes' }, function (response) {
            const nodes = JSON.parse(response);
            const nodesById = {};
            nodes.forEach(node => {
                nodesById[node.id] = node;
            });

            const buildTree = (parentId, container) => {
                nodes.filter(node => node.parent_id == parentId).forEach(node => {
                    const nodeElement = createNodeElement(node.id, node.name, node.has_children, node.expanded);
                    container.append(nodeElement);
                    if (node.has_children && node.expanded) {
                        buildTree(node.id, $(`[data-id=${node.id}] .children`));
                    }
                });
                updateExpandButtons();
            };

            buildTree(null, $('#tree-container'));

            if ($(".node").length == 0) {
                $('#create-root').show();
            } else {
                $('#create-root').hide();
            }
        });
    }

    function startCountdown(seconds, nodeId) {
        let timer = seconds;
        $('#popup-timer').text(`Time Left: ${timer}s`);
        interval = setInterval(function () {
            timer--;
            $('#popup-timer').text(`Time Left: ${timer}s`);
            if (timer <= 0) {
                deleteNode(nodeId);
                clearInterval(interval);
                $('#confirmation-popup').modal('hide');
            }
        }, 1000);
    }

    function stopCountdown() {
        $('#popup-timer').text('');
        clearInterval(interval);
    }

    function deleteNode(nodeId) {
        $.post('php/nodes.php', { action: 'delete_node', id: nodeId }, function () {
            $(`[data-id=${nodeId}]`).remove();
            if ($(".node").length == 0) {
                $('#create-root').show();
            }
        });
    }

});
