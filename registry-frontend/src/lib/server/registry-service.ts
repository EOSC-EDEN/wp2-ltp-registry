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

	// Helper to normalize types for comparison (e.g. "dcat:DataService" -> "Data Service")
	const normalizeType = (uri: string | string[]) => {
		const val = Array.isArray(uri) ? uri[0] : uri;
		return val.replace(/^.*[:/]([^:/]+)$/, '$1').replace(/([A-Z])/g, ' $1').trim();
	};

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
			} else if (key === 'Type') {
				const typeLabel = normalizeType(service.type);
				if (allowedValues.includes(typeLabel)) match = true;
			} else if (key === 'Contact Point') {
				const contacts = service.contactPoint?.map(c => c.fn) || [];
				if (allowedValues.some(v => contacts.includes(v))) match = true;
			} else if (key === 'Contains Process') {
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
		'Contains Process': [],
		'Publisher': [],
		'Type': [],
		'Contact Point': [],
		'Country': [],
		// 'Page': [] // Uncomment if you really want to filter by URL, usually too noisy
	};

	// Helper to aggregate counts
	const aggregate = (extractor: (s: DataService) => string | string[] | undefined) => {
		const counts = new Map<string, number>();
		filteredServices.forEach((s) => {
			const rawVal = extractor(s);
			if (!rawVal) return;
			const values = Array.isArray(rawVal) ? rawVal : [rawVal];
			
			values.forEach(val => {
				counts.set(val, (counts.get(val) || 0) + 1);
			});
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
	facets['Type'] = aggregate((s) => normalizeType(s.type));
	facets['Contact Point'] = aggregate((s) => s.contactPoint?.map(c => c.fn));
	// facets['Page'] = aggregate((s) => s.documentation); // Optional: Re-enable if needed

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