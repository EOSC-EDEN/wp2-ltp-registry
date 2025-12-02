<!-- CatalogShell.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import MobileFilters from './MobileFilters.svelte';
	import CatalogHeader from './CatalogHeader.svelte';
	import DesktopFilters from './DesktopFilters.svelte';
	import {
		setCatalogContext,
		createCatalogContextValue
	} from '$lib/context/catalog-context.svelte';
	import type { FacetCount } from '$lib/server/registry-service';

	interface Props {
		title: string;
		facets: Record<string, FacetCount[]>;
		onFilterChange?: (filters: Map<string, string[]>) => Promise<void>;
		children?: Snippet;
	}

	let { title, facets, onFilterChange, children }: Props = $props();

	// Initialize context with the clean facet object
	const catalogContext = createCatalogContextValue(facets, onFilterChange);
	setCatalogContext(catalogContext);

	let mobileFiltersOpen = $state(false);

	function openMobileFilters() {
		mobileFiltersOpen = true;
	}
</script>

<div class="bg-white">
	<MobileFilters bind:isOpen={mobileFiltersOpen} />

	<main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<CatalogHeader {title} onOpenFilters={openMobileFilters} />

		<section aria-labelledby="catalog-heading" class="pt-6 pb-24">
			<h2 id="catalog-heading" class="sr-only">Catalog Items</h2>

			<div class="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
				<DesktopFilters />

				<div class="lg:col-span-3">
					{#if children}
						{@render children()}
					{/if}
				</div>
			</div>
		</section>
	</main>
</div>