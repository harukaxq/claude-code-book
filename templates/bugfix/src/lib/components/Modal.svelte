<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();

	let dialog: HTMLDialogElement | undefined;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	function onBackdropClick(event: MouseEvent) {
		if (event.target === dialog) open = false;
	}
</script>

<dialog bind:this={dialog} class="modal" onclose={() => (open = false)} onclick={onBackdropClick}>
	<div class="modal-head">
		<h2>{title}</h2>
		<button type="button" class="modal-close" aria-label="閉じる" onclick={() => (open = false)}
			>×</button
		>
	</div>
	<div class="modal-body">
		{@render children()}
	</div>
</dialog>
