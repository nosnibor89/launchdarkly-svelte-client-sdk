import * as LDClient from 'launchdarkly-js-client-sdk';
import { writable, derived, type Writable, get, readonly, type Readable } from 'svelte/store';
import { DEV } from 'esm-env';

//TODO: Add logging strategy
function debugLog(callback: () => void): void {
	if (DEV) {
		callback();
	}
}

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;
export type LDClentID = string;
export type LDContext = LDClient.LDContext;
export type LDFlagsValue = boolean | string | number | JSONValue;
type LDFlags = Record<string, LDFlagsValue>;

function createLD() {
	let ldClient: LDClient.LDClient | undefined;
	const loading = writable(true);
	const flags = writable<LDFlags>({});

	function initialize(clientId: LDClentID, context: LDContext) {
		debugLog(() => console.log('Initializing LaunchDarkly client'));
		ldClient = LDClient.initialize(clientId, context);
		ldClient.waitUntilReady().then(() => {
			loading.set(false);
			flags.set(ldClient!.allFlags());
		});

		ldClient.on('change', (changes) => {
			debugLog(() => console.log('Flags updated', changes));
			flags.set(ldClient!.allFlags());
		});

		return {
			initializing: loading
		};
	}

	async function identify(context: LDContext) {
		if (ldClient) {
			return ldClient.identify(context);
		}
	}

	return {
		identify,
		flags: readonly(flags),
		initialize,
		intializing: readonly(loading),
		watch: (flagKey: string): Readable<LDFlagsValue> => {
			return derived<Writable<LDFlags>, LDFlagsValue>(flags, ($flags) => {
				debugLog(() => console.log('watching', flagKey, $flags[flagKey], $flags));
				return $flags[flagKey];
			});
		},
		isOn: (flagKey: string): boolean => {
			const currentFlags = get(flags);
			return !!currentFlags[flagKey];
		}
	};
}

export const LD = createLD();
