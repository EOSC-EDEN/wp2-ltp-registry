import { searchRegistry } from '$lib/server/registry-service';
import { adaptServiceToProperties } from '$lib/utils/adapter';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	// Initial load: No filters
	const filters = new Map<string, string[]>();
	const result = await searchRegistry(filters);

	return {
		facets: result.facets,
		services: result.services.map(adaptServiceToProperties)
	};
};

export const actions = {
	filter: async ({ request }) => {
		const formData = await request.formData();
		const filtersJson = formData.get('filters');

		const filters = new Map<string, string[]>();
		if (filtersJson && typeof filtersJson === 'string') {
			const filtersObj = JSON.parse(filtersJson);
			for (const [key, value] of Object.entries(filtersObj)) {
				filters.set(key, value as string[]);
			}
		}

		const result = await searchRegistry(filters);

		return {
			success: true,
			facets: result.facets,
			services: result.services.map(adaptServiceToProperties)
		};
	}
} satisfies Actions;