///<reference path="backbone.d.ts" />

declare module Backbone {

	export class LocalStorage {
		constructor(name: string);

		public save();
		public create(model: Backbone.Model);
		public update(model: Backbone.Model);
		public find(model: Backbone.Model);
		public findAll();
		public destroy(model: Backbone.Model);
		public localStorage();

		static localSync(method: string, model: Backbone.Model, options, error: (message: string) => any );
	}

	export function localSync(method: string, model: Backbone.Model, options, error: (message: string) => any );

	export function ajaxSync(method: string, model: Backbone.Model, options);

	export function getSyncMethod(model: Backbone.Model);

}