import { createContext } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { FacetCount } from '$lib/server/registry-service';

export interface FilterItem {
	value: string;
	label: string;
	checked?: boolean;
	count?: number;
}

export interface FilterGroup {
	id: string;
	title: string;
	name: string;
	items: FilterItem[];
	propertyUri?: string;
}

// Grouped properties by property URI (For UI display)
export interface GroupedProperty {
	propUri: string;
	propLabel: string;
	values: Array<{ val: string; valLabel: string }>;
}

// Service with grouped properties
export interface ServiceWithProperties {
	serviceUri: string;
	title?: string;
	description?: string;
	properties: GroupedProperty[];
}

// Catalog context value interface
export interface CatalogContextValue {
	filterGroups: FilterGroup[];
	selectedFilters: SvelteMap<string, Set<string>>;
	updateFilter: (propertyUri: string, valueUri: string, checked: boolean) => Promise<void>;
	isLoading: boolean;
}

// Create type-safe context getters/setters
export const [getCatalogContext, setCatalogContext] = createContext<CatalogContextValue>();

/**
 * Initialize catalog context value from structured Facets
 * @param facets - Dictionary of facet arrays { "Publisher": [{label, value, count}, ...] }
 * @param onFilterChange - Callback to trigger when filters change
 */
export function createCatalogContextValue(
	facets: Record<string, FacetCount[]>,
	onFilterChange?: (filters: Map<string, string[]>) => Promise<void>
): CatalogContextValue {
	
	// Convert the clean FacetCount objects into the UI FilterGroup structure
	const initialGroups: FilterGroup[] = Object.entries(facets).map(([key, items]) => ({
		id: key,
		title: key, // e.g. "Publisher"
		name: key,
		propertyUri: key, // In JSON-LD mode, the key acts as the ID
		items: items.map(item => ({
			value: item.value,
			label: `${item.label} (${item.count})`,
			count: item.count,
			checked: false
		}))
	}));

	const filterGroups = $state(initialGroups);
	const selectedFilters = new SvelteMap<string, Set<string>>();
	const state = $state({ isLoading: false });

	const updateFilter = async (propertyUri: string, valueUri: string, checked: boolean) => {
		if (!selectedFilters.has(propertyUri)) {
			selectedFilters.set(propertyUri, new SvelteSet());
		}

		const propFilters = selectedFilters.get(propertyUri)!;
		if (checked) {
			propFilters.add(valueUri);
		} else {
			propFilters.delete(valueUri);
		}

		// Update checked state in UI
		const group = filterGroups.find(g => g.propertyUri === propertyUri);
		if (group) {
			const item = group.items.find(i => i.value === valueUri);
			if (item) item.checked = checked;
		}

		// Trigger re-query
		if (onFilterChange) {
			state.isLoading = true;
			try {
				const filtersMap = new Map<string, string[]>();
				for (const [prop, values] of selectedFilters) {
					if (values.size > 0) {
						filtersMap.set(prop, Array.from(values));
					}
				}
				await onFilterChange(filtersMap);
			} finally {
				state.isLoading = false;
			}
		}
	};

	return {
		filterGroups,
		selectedFilters,
		updateFilter,
		get isLoading() {
			return state.isLoading;
		}
	};
}