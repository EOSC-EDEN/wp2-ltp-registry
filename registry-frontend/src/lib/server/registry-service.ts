import { readFile } from 'fs/promises';
import { join } from 'path';
import type { DataService } from '$lib/types/registry';

let cachedData: DataService[] | null = null;

// Mock loading data from a document store (JSON file)
async function getServices(): Promise<DataService[]> {
	if (cachedData) return cachedData;

	const filePath = join(process.cwd(), 'static/registry-data.json');
	const fileContent = await readFile(filePath, 'utf-8');
	const json = JSON.parse(fileContent);

	cachedData = json['@graph'] as DataService[];
	return cachedData;
}

export interface FacetCount {
	label: string;
	value: string;
	count: number;
}

export interface SearchResult {
	services: DataService[];
	facets: Record<string, FacetCount[]>;
}

export async function searchRegistry(filters: Map<string, string[]>): Promise<SearchResult> {
	const allServices = await getServices();

	// 1. Filter Services based on nested document properties
	const filteredServices = allServices.filter((service) => {
		if (filters.size === 0) return true;

		for (const [key, allowedValues] of filters.entries()) {
			if (allowedValues.length === 0) continue;

			let match = false;

			// Logic to map filter keys to document properties
			if (key === 'Publisher') {
				const val = service.publisher?.name;
				if (val && allowedValues.includes(val)) match = true;
			} else if (key === 'Country') {
				const val = service.publisher?.countryName;
				if (val && allowedValues.includes(val)) match = true;
			} else if (key === 'Contains Process') {
				// Check array of nested CPP objects
				if (service.containsProcess) {
					const titles = service.containsProcess.map((c) => c.title);
					if (allowedValues.some((v) => titles.includes(v))) match = true;
				}
			}

			if (!match) return false;
		}
		return true;
	});

	// 2. Calculate Facets (Aggregation)
	const facets: Record<string, FacetCount[]> = {
		Publisher: [],
		Country: [],
		'Contains Process': []
	};

	// Helper to aggregate counts
	const aggregate = (extractor: (s: DataService) => string | undefined) => {
		const counts = new Map<string, number>();
		filteredServices.forEach((s) => {
			const val = extractor(s);
			if (val) counts.set(val, (counts.get(val) || 0) + 1);
		});
		return Array.from(counts.entries())
			.map(([val, count]) => ({
				label: val,
				value: val,
				count
			}))
			.sort((a, b) => b.count - a.count);
	};

	facets['Publisher'] = aggregate((s) => s.publisher?.name);
	facets['Country'] = aggregate((s) => s.publisher?.countryName);

	// Custom aggregation for CPPs (Array)
	const cppCounts = new Map<string, number>();
	filteredServices.forEach((s) => {
		s.containsProcess?.forEach((cpp) => {
			cppCounts.set(cpp.title, (cppCounts.get(cpp.title) || 0) + 1);
		});
	});
	facets['Contains Process'] = Array.from(cppCounts.entries())
		.map(([val, count]) => ({ label: val, value: val, count }))
		.sort((a, b) => b.count - a.count);

	return {
		services: filteredServices,
		facets
	};
}