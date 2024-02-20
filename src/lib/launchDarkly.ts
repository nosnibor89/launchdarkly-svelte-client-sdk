import * as LDClient from 'launchdarkly-js-client-sdk';
import { writable, derived, type Writable, get, readonly } from 'svelte/store';
import { DEV } from 'esm-env';

//TODO: Definetively improve this
function debugLog(callback: () => void): void {
	if (DEV) {
		callback();
	}
}

export type LDClentID = string;
export type LDContext = LDClient.LDContext;
export type LDFlagsValue = string | boolean;
type LDFlags = Record<string, LDFlagsValue>;

function createLD() {
	let ldClient: LDClient.LDClient | undefined;
	const loading = writable(true);
	const flags = writable<LDFlags>({});

	function initialize(clientId: LDClentID, context: LDContext) {
		debugLog(() => {
			console.log('Initializing LaunchDarkly client');
		});
		ldClient = LDClient.initialize(clientId, context);
		ldClient.waitUntilReady().then(() => {
			loading.set(false);
			flags.set(ldClient!.allFlags());
		});

		ldClient.on('change', (changes) => {
			console.log('Flags updated', changes);
			flags.set(ldClient!.allFlags());
		});

		return {
			initializing: loading
		};
	}

	return {
		client: ldClient,
		flags: readonly(flags),
		initialize,
		intializing: readonly(loading),
		watch: (flagKey: string) => {
			return derived<Writable<LDFlags>, LDFlagsValue>(flags, ($flags) => {
				console.log('watching', flagKey, $flags[flagKey], $flags);
				return !!$flags[flagKey];
			});
		},
		isOn: (flagKey: string): boolean => {
			const currentFlags = get(flags);
			return !!currentFlags[flagKey];
		}
	};
}

export const LD = createLD();
