<script lang="ts">
	import CatalogItem from '$lib/components/card/CatalogItem.svelte';
	import CatalogShell from '$lib/components/shell/CatalogShell.svelte';
	import type { PageData } from './$types';
	import { deserialize } from '$app/forms';
	import type { ServiceWithProperties } from '$lib/context/catalog-context.svelte';
	import type { FacetCount } from '$lib/server/registry-service';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Reactive state
	let services = $state<ServiceWithProperties[]>(data.services);
	let facets = $state<Record<string, FacetCount[]>>(data.facets);

	$effect(() => {
		services = data.services;
		facets = data.facets;
	});

	async function handleFilterChange(filters: Map<string, string[]>) {
		const filtersObj: Record<string, string[]> = {};
		for (const [key, value] of filters) {
			filtersObj[key] = value;
		}

		const formData = new FormData();
		formData.append('filters', JSON.stringify(filtersObj));

		const response = await fetch('?/filter', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const result = deserialize(await response.text());

			if (result.type === 'success' && result.data) {
				const actionData = result.data as {
					services: ServiceWithProperties[];
					facets: Record<string, FacetCount[]>;
				};
				services = actionData.services;
				facets = actionData.facets;
			}
		}
	}
</script>

<CatalogShell
	title="EOSC-EDEN Registry Catalog"
	facets={facets}
	onFilterChange={handleFilterChange}
>
	<div class="space-y-4">
		{#each services as service (service.serviceUri)}
			<CatalogItem
				serviceUri={service.serviceUri}
				title={service.title}
				description={service.description}
				properties={service.properties}
			/>
		{/each}
	</div>
</CatalogShell>