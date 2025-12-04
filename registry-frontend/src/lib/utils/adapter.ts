import type { DataService } from '$lib/types/registry';
import type { ServiceWithProperties, GroupedProperty } from '$lib/context/catalog-context.svelte';

export function adaptServiceToProperties(service: DataService): ServiceWithProperties {
	const properties: GroupedProperty[] = [];

	const addProp = (label: string, value: string | undefined, uri?: string, displayLabel?: string) => {
		if (!value) return;
		
		let group = properties.find(p => p.propLabel === label);
		if (!group) {
			group = {
				propUri: uri || `internal:${label.toLowerCase().replace(/\s+/g, '-')}`,
				propLabel: label,
				values: []
			};
			properties.push(group);
		}

		group.values.push({
			val: value,
			valLabel: displayLabel || value
		});
	};

	if (service.publisher) {
		addProp('Publisher', service.publisher.name, 'dct:publisher');
		if (service.publisher.countryName) {
			addProp('Country', service.publisher.countryName, 'vcard:country-name');
		}
	}

	if (service.type) {
		const typeStr = Array.isArray(service.type) ? service.type[0] : service.type;
		const displayType = typeStr.replace(/^.*[:/]([^:/]+)$/, '$1').replace(/([A-Z])/g, ' $1').trim();
		addProp('Type', displayType, 'rdf:type');
	}

	if (service.inCatalog) {
		addProp('Part of Repository', service.inCatalog.id, 'dcat:inCatalog', service.inCatalog.title);
	}

	if (service.hasService) {
		const children = Array.isArray(service.hasService) ? service.hasService : [service.hasService];
		children.forEach(child => {
			const label = child.title || child.id; 
			addProp('Contains Service', child.id, 'dcat:service', label);
		});
	}

	if (service.contactPoint && service.contactPoint.length > 0) {
		const contact = service.contactPoint[0];
		addProp('Contact Point', contact.fn, 'dcat:contactPoint');
		if (contact.email) {
			const emailDisplay = contact.email.replace('mailto:', '');
			addProp('Email', contact.email, 'vcard:hasEmail', emailDisplay);
		}
	}

	if (service.endpointURL) {
		addProp('Endpoint', service.endpointURL, 'dcat:endpointURL', service.endpointURL);
	}
	
	if (service.landingPage) {
		addProp('Landing Page', service.landingPage, 'dcat:landingPage', service.landingPage);
	}

	if (service.documentation) {
		const docs = Array.isArray(service.documentation) ? service.documentation : [service.documentation];
		docs.forEach(doc => {
			addProp('Documentation', doc, 'foaf:page', doc);
		});
	}

	if (service.containsProcess) {
		service.containsProcess.forEach(cpp => {
			const display = cpp.label ? `${cpp.label}: ${cpp.title}` : cpp.title;
			const link = cpp.page || cpp.id;
			addProp('Has CPP', link, 'obo:BFO_0000067', display);
		});
	}

	return {
		serviceUri: service.id,
		title: service.title,
		description: service.description,
		properties
	};
}