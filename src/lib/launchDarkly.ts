import * as LDClient from 'launchdarkly-js-client-sdk';
import { writable, derived, type Writable, get, readonly, type Readable } from 'svelte/store';
import { DEV } from 'esm-env';

/**
 * Logs debug information if in development mode.
 * @param {() => void} callback - The callback that logs the debug information.
 * TODO: Add better logging strategy.
 */
function debugLog(callback: () => void): void {
	if (DEV) {
		callback();
	}
}

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

/** Client ID for LaunchDarkly */
export type LDClentID = string;

/** Context for LaunchDarkly */
export type LDContext = LDClient.LDContext;

/** Value of LaunchDarkly flags */
export type LDFlagsValue = JSONValue;

/** Flags for LaunchDarkly */
export type LDFlags = Record<string, LDFlagsValue>;

export type LDInstance = ReturnType<typeof createLD>;

/**
 * Creates a LaunchDarkly instance.
 * @returns {Object} The LaunchDarkly instance object.
 */
function createLD() {
	let ldClient: LDClient.LDClient | undefined;
	const loading = writable(true);
	const flagsWritable = writable<LDFlags>({});

	/**
	 * Initializes the LaunchDarkly client.
	 * @param {LDClentID} clientId - The client ID.
	 * @param {LDContext} context - The context.
	 * @returns {Writable<boolean>} An object with the initialization status store.
	 */
	function initialize(clientId: LDClentID, context: LDContext) {
		debugLog(() => console.log('Initializing LaunchDarkly client'));

		ldClient = LDClient.initialize(clientId, context);

		ldClient.waitUntilReady().then(() => {
			loading.set(false);
			flagsWritable.set(ldClient!.allFlags());
		});

		ldClient.on('change', (changes) => {
			debugLog(() => console.log('Flags updated', changes));
			flagsWritable.set(ldClient!.allFlags());
		});

		return {
			initializing: loading
		};
	}

	/**
	 * Identifies the user context.
	 * @param {LDContext} context - The user context.
	 * @returns {Promise} A promise that resolves when the user is identified.
	 */
	async function identify(context: LDContext) {
		return ldClient?.identify(context);
	}

	/**
	 * Watches a flag for changes.
	 * @param {string} flagKey - The key of the flag to watch.
	 * @returns {Readable<LDFlagsValue>} A readable store of the flag value.
	 */
	const watch = (flagKey: string): Readable<LDFlagsValue> => {
		return derived<Writable<LDFlags>, LDFlagsValue>(flagsWritable, ($flags) => {
			debugLog(() => console.log('watching', flagKey, $flags[flagKey], $flags));
			return $flags[flagKey];
		});
	};

	/**
	 * Checks if a flag is on.
	 * @param {string} flagKey - The key of the flag to check.
	 * @returns {boolean} True if the flag is on, false otherwise.
	 */
	const isOn = (flagKey: string): boolean => {
		const currentFlags = get(flagsWritable);
		return !!currentFlags[flagKey];
	};

	return {
		identify,
		flags: readonly(flagsWritable),
		initialize,
		initializing: readonly(loading),
		watch,
		isOn
	};
}

/** The LaunchDarkly instance */
export const LD = createLD();
