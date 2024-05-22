import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LD, type LDInstance } from '../launchDarkly.js';
import * as LDClient from 'launchdarkly-js-client-sdk';

describe('launchDarkly', () => {
	vi.mock('launchdarkly-js-client-sdk', () => {
		return {
			initialize: vi.fn().mockImplementation(() => {
				return {
					waitUntilReady: vi.fn().mockResolvedValue(Promise.resolve()),
					allFlags: vi.fn().mockReturnValue({
						flag1: true
					}),
					on: vi.fn()
				};
			}) as typeof LDClient.initialize
		};
	});
	describe('createLD', () => {
		let ld: LDInstance;

		beforeEach(() => {
			ld = LD;
		});

		it('should create a LaunchDarkly instance with correct properties', () => {
			expect(typeof ld).toBe('object');
			expect(ld).toHaveProperty('identify');
			expect(ld).toHaveProperty('flags');
			expect(ld).toHaveProperty('initialize');
			expect(ld).toHaveProperty('initializing');
			expect(ld).toHaveProperty('watch');
			expect(ld).toHaveProperty('isOn');
		});

		describe('initialize', async () => {
			it('should initialize the LaunchDarkly SDK instance', async () => {
				const initializeSpy = vi.spyOn(LDClient, 'initialize');

				await ld.initialize('clientId', { key: 'user1' });
				expect(initializeSpy).toHaveBeenCalledWith('clientId', { key: 'user1' });
			});

			it('should set flags when the client is ready', async () => {
				const waitUntilReadySpy = vi.spyOn(LDClient, 'initialize');

				const flagSubscriber = vi.fn();
				await ld.initialize('clientId', { key: 'user1' });

				const subscribeSpy = vi.spyOn(ld.flags, 'subscribe');
				ld.flags.subscribe(flagSubscriber);

				expect(waitUntilReadySpy).toHaveBeenCalled();
				expect(subscribeSpy).toBeDefined();
				expect(flagSubscriber).toHaveBeenCalledTimes(1);
				expect(flagSubscriber).toHaveBeenCalledWith({ flag1: true });
			});

			it('should get the correct flags when subscribing', async () => {
				const flagSubscriber = vi.fn();
				await ld.initialize('clientId', { key: 'user1' });

				const subscribeSpy = vi.spyOn(ld.flags, 'subscribe');
				ld.flags.subscribe(flagSubscriber);

				expect(subscribeSpy).toBeDefined();
				expect(flagSubscriber).toHaveBeenCalledTimes(1);
				expect(flagSubscriber).toHaveBeenCalledWith({ flag1: true });
			});
		});
	});
});
