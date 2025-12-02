import type { DataService } from '$lib/types/registry';
import type { ServiceWithProperties, GroupedProperty } from '$lib/context/catalog-context.svelte';

/**
 * Adapts the specific DataService Type to the generic "Property List" format
 * expected by the existing UI components.
 */
export function adaptServiceToProperties(service: DataService): ServiceWithProperties {
	const properties: GroupedProperty[] = [];

	const addProp = (label: string, value: string | undefined, uri?: string, displayLabel?: string) => {
		if (!value) return;
		
		// Check if property group exists
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

	// 1. Publisher
	if (service.publisher) {
		addProp('Publisher', service.publisher.name, 'dct:publisher');
		if (service.publisher.countryName) {
			addProp('Country', service.publisher.countryName, 'vcard:country-name');
		}
	}

	// 2. Type (New)
	if (service.type) {
		const typeStr = Array.isArray(service.type) ? service.type[0] : service.type;
		// Clean "dcat:DataService" to "Data Service"
		const displayType = typeStr.replace(/^.*[:/]([^:/]+)$/, '$1').replace(/([A-Z])/g, ' $1').trim();
		addProp('Type', displayType, 'rdf:type');
	}

	// 3. Contact Point
	if (service.contactPoint && service.contactPoint.length > 0) {
		const contact = service.contactPoint[0];
		addProp('Contact Point', contact.fn, 'dcat:contactPoint');
		if (contact.email) {
			// Clean mailto: for display
			const emailDisplay = contact.email.replace('mailto:', '');
			addProp('Email', contact.email, 'vcard:hasEmail', emailDisplay);
		}
	}

	// 4. URLs
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

	// 5. CPPs
	if (service.containsProcess) {
		service.containsProcess.forEach(cpp => {
			// Special handling: Value is URI, Label is Title
			// The UI component for CPP expects this specific structure
			addProp('Has CPP', cpp.id, 'obo:BFO_0000067', cpp.title);
		});
	}

	return {
		serviceUri: service.id,
		title: service.title,
		description: service.description,
		properties
	};
}