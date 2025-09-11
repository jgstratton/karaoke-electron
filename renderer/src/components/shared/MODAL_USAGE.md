# Shared Modal System

This document explains how to use the shared modal CSS module and component system for consistent modal styling across the application.

## Files Created

- `renderer/src/components/shared/Modal.module.css` - Shared modal styles
- `renderer/src/components/shared/Modal.tsx` - Reusable modal component

## Usage Options

### Option 1: Use the Modal Component (Recommended)

```tsx
import Modal, { modalStyles } from '../../../components/shared/Modal'

function MyModal({ isOpen, onClose }) {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="My Modal Title"
			size="large" // small, medium, large, xlarge
			fullHeight={false}
			footer={
				<button className={modalStyles.primaryBtn} onClick={onClose}>
					Save Changes
				</button>
			}
		>
			<p>Modal content goes here</p>
		</Modal>
	)
}
```

### Option 2: Use Shared Styles Directly

```tsx
import { modalStyles } from '../../../components/shared/Modal'

function CustomModal({ isOpen, onClose }) {
	if (!isOpen) return null

	return (
		<div className={modalStyles.overlay} onClick={onClose}>
			<div
				className={`${modalStyles.content} ${modalStyles.large}`}
				onClick={e => e.stopPropagation()}
			>
				<div className={modalStyles.header}>
					<h2>Custom Layout</h2>
					<button className={modalStyles.closeBtn} onClick={onClose}>
						×
					</button>
				</div>
				<div className={modalStyles.body}>{/* Custom content */}</div>
			</div>
		</div>
	)
}
```

## Available Style Classes

### Layout Classes

- `overlay` - Modal backdrop
- `content` - Modal container
- `header` - Modal header section
- `body` - Modal content area
- `footer` - Modal footer section

### Size Classes

- `small` - 400px width, 60vh max height
- `medium` - 600px width, 70vh max height (default)
- `large` - 80vw width, 1000px max width, 80vh max height
- `xlarge` - 90vw width, 1200px max width, 85vh max height
- `fullHeight` - 85vh height

### Button Classes

- `primaryBtn` - Green primary button
- `secondaryBtn` - Gray secondary button
- `dangerBtn` - Red danger button
- `closeBtn` - Modal close button

### Content Classes

- `loadingContainer` - Centered loading state
- `sectionHeader` - Header with title and actions
- `sectionTitle` - Blue section title
- `infoSection` - Section with bottom border
- `codeBlock` - Code display with dark background
- `scrollableList` - Scrollable list container
- `listItem` - Individual list item
- `listItemHeader` - List item header
- `listItemTitle` - List item title
- `listItemContent` - List item content
- `noData` - Empty state message

## Examples

### Simple Modal

```tsx
<Modal isOpen={true} onClose={handleClose} title="Simple Modal">
	<p>This is a simple modal with default settings.</p>
</Modal>
```

### Large Modal with Footer

```tsx
<Modal
	isOpen={true}
	onClose={handleClose}
	title="Data Editor"
	size="large"
	footer={
		<>
			<button className={modalStyles.secondaryBtn} onClick={handleClose}>
				Cancel
			</button>
			<button className={modalStyles.primaryBtn} onClick={handleSave}>
				Save
			</button>
		</>
	}
>
	<div className={modalStyles.infoSection}>
		<h3 className={modalStyles.sectionTitle}>Settings</h3>
		{/* Settings content */}
	</div>
</Modal>
```

### Code Display Modal

```tsx
<Modal isOpen={true} onClose={handleClose} title="JSON Data" size="large">
	<div className={modalStyles.sectionHeader}>
		<h3 className={modalStyles.sectionTitle}>Response Data</h3>
		<button className={modalStyles.primaryBtn} onClick={copyToClipboard}>
			<i className="fas fa-copy"></i> Copy
		</button>
	</div>
	<pre className={modalStyles.codeBlock}>{JSON.stringify(data, null, 2)}</pre>
</Modal>
```

### List Display Modal

```tsx
<Modal isOpen={true} onClose={handleClose} title="Items" size="large">
	<div className={modalStyles.scrollableList}>
		{items.map(item => (
			<div key={item.id} className={modalStyles.listItem}>
				<div className={modalStyles.listItemHeader}>
					<span className={modalStyles.listItemTitle}>{item.name}</span>
					<button className={modalStyles.dangerBtn} onClick={() => deleteItem(item.id)}>
						<i className="fas fa-trash"></i>
					</button>
				</div>
				<div className={modalStyles.listItemContent}>{item.description}</div>
			</div>
		))}
	</div>
</Modal>
```

## Migration Guide

### Converting Existing Modals

1. **Replace modal structure imports:**

    ```tsx
    // Before
    // Using global CSS classes like "modal-overlay", "modal-content"

    // After
    import Modal, { modalStyles } from '../../../components/shared/Modal'
    ```

2. **Update className references:**

    ```tsx
    // Before
    className="modal-overlay"
    className="modal-content"
    className="modal-header"

    // After
    className={modalStyles.overlay}
    className={modalStyles.content}
    className={modalStyles.header}
    ```

3. **Use size variants:**

    ```tsx
    // Before
    className="modal-content database-explorer-modal"

    // After
    className={`${modalStyles.content} ${modalStyles.large}`}
    ```

### Benefits of Migration

- **Consistency** - All modals use the same base styling
- **Maintainability** - Changes to modal appearance only need to be made in one place
- **Type Safety** - CSS Modules provide TypeScript support for class names
- **Bundle Optimization** - Shared styles reduce CSS duplication
- **Flexibility** - Easy to customize individual modals while maintaining consistency

### Migration Status

- ✅ **DatabaseExplorerModal** - Uses shared modal styles directly
- ✅ **ReduxStoreModal** - Uses shared Modal component
- ✅ **SettingsModal** - Uses shared Modal component with custom styling
- ✅ **MediaBrowserModal** - Uses shared Modal component with component-specific CSS module

**All modals have been successfully migrated to the shared modal system!**
