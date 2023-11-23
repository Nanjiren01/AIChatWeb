import { BUILTIN_MASKS } from "../masks";
import { getLang, Lang } from "../locales";
import { DEFAULT_TOPIC, ChatMessage } from "./chat";
import { ModelConfig, useAppConfig } from "./config";
import { StoreKey } from "../constant";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";

export type Mask = {
  id: string;
  createdAt: number;
  avatar: string;
  name: string;
  hideContext?: boolean;
  context: ChatMessage[];
  syncGlobalConfig?: boolean;
  modelConfig: ModelConfig;
  lang: Lang;
  builtin: boolean;
  state?: number;
  type?: string;
  modelConfigJson?: string | undefined;
  contextJson?: string | undefined;
  createTime?: Date;
  updateTime?: Date;
};

export const DEFAULT_MASK_STATE = {
  masks: {} as Record<string, Mask>,
};

export type MaskState = typeof DEFAULT_MASK_STATE;

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export const createEmptyMask = () =>
  ({
    id: nanoid(),
    avatar: DEFAULT_MASK_AVATAR,
    name: DEFAULT_TOPIC,
    context: [],
    syncGlobalConfig: true, // use global config as default
    modelConfig: { ...useAppConfig.getState().modelConfig },
    lang: getLang(),
    builtin: false,
    createdAt: Date.now(),
  }) as Mask;

export interface RemoteMask {
  id: number | string;
  name: string;
  avatar: string;
  lang: Lang;
  state?: number;
  type?: string;
  syncGlobalConfig?: boolean;
  modelConfigJson?: string | undefined;
  contextJson?: string | undefined;
  context?: ChatMessage[];
  modelConfig: ModelConfig;
  builtin?: any;
  createTime?: Date;
  updateTime?: Date;
  hideContext?: boolean;
}

import { Response } from "../api/common";
export type RemoteMaskListResponse = Response<RemoteMask[]>;

export const useMaskStore = createPersistStore(
  { ...DEFAULT_MASK_STATE },

  (set, get) => ({
    create(mask?: Partial<Mask>) {
      const masks = get().masks;
      const id = nanoid();
      masks[id] = {
        ...createEmptyMask(),
        ...mask,
        id,
        builtin: false,
      };

      set(() => ({ masks }));
      get().markUpdate();

      return masks[id];
    },
    updateMask(id: string | number, updater: (mask: Mask) => void) {
      const masks = get().masks;
      const mask = masks[id];
      if (!mask) return;
      const updateMask = { ...mask };
      updater(updateMask);
      masks[id] = updateMask;
      set(() => ({ masks }));
      get().markUpdate();
    },
    delete(id: string | number) {
      const masks = get().masks;
      delete masks[id];
      set(() => ({ masks }));
      get().markUpdate();
    },

    get(id?: string | number) {
      return get().masks[id ?? 1145141919810];
    },
    async fetch(token: string) {
      const url = "/mask/normal";
      const BASE_URL = process.env.BASE_URL;
      const mode = process.env.BUILD_MODE;
      let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
      return fetch(requestUrl, {
        method: "get",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((res) => res.json())
        .then((resp: RemoteMaskListResponse) => {
          const masks = resp.data;
          const remoteMasks = (masks || []).map((mask) => {
            let context, modelConfig;
            try {
              context = JSON.parse(mask.contextJson || "{}");
            } catch (e) {
              console.error(
                "mask.contextJson is not json",
                mask.contextJson,
                e,
              );
              context = [];
            }
            try {
              modelConfig = JSON.parse(mask.modelConfigJson || "{}");
            } catch (e) {
              console.error(
                "mask.modelConfigJson is not json",
                mask.modelConfigJson,
                e,
              );
              modelConfig = {};
            }
            modelConfig.template = "{{input}}";
            const remoteMask: RemoteMask = {
              id: mask.id,
              name: mask.name,
              avatar: mask.avatar,
              lang: mask.lang,
              builtin: true,
              state: mask.state,
              type: mask.type,
              context: context,
              modelConfig: modelConfig,
              createTime: mask.createTime,
              updateTime: mask.updateTime,
              hideContext: mask.hideContext,
            };
            return remoteMask;
          });
          console.log("remoteMasks", remoteMasks);
          return remoteMasks;
        });
    },
    getUserMasks() {
      return Object.values(get().masks);
    },
    getAll() {
      const userMasks = Object.values(get().masks).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      const config = useAppConfig.getState();
      if (config.hideBuiltinMasks) return userMasks;
      const buildinMasks = BUILTIN_MASKS.map(
        (m) =>
          ({
            ...m,
            modelConfig: {
              ...config.modelConfig,
              ...m.modelConfig,
            },
          }) as Mask,
      );
      return userMasks.concat(buildinMasks);
    },
    search(text: string) {
      return Object.values(get().masks);
    },
  }),
  {
    name: StoreKey.Mask,
    version: 3.1,

    migrate(state, version) {
      const newState = JSON.parse(JSON.stringify(state)) as MaskState;

      // migrate mask id to nanoid
      if (version < 3) {
        Object.values(newState.masks).forEach((m) => (m.id = nanoid()));
      }

      if (version < 3.1) {
        const updatedMasks: Record<string, Mask> = {};
        Object.values(newState.masks).forEach((m) => {
          updatedMasks[m.id] = m;
        });
        newState.masks = updatedMasks;
      }

      return newState as any;
    },
  },
);
