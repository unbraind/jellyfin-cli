import type { BaseItemDto, QueryResult, SearchResult, ActivityLogEntry, LibraryVirtualFolder, LiveTvInfo } from '../types/index.js';
import { formatToon } from './base.js';

/**
 * Produces the validated format items result used by CLI automation.
 * @param items - The items value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatItems(items: BaseItemDto[]): string {
  return formatToon(items.map(i => ({
    id: i.Id,
    name: i.Name,
    type: i.Type,
    year: i.ProductionYear,
    rating: i.CommunityRating,
    rt: i.RunTimeTicks,
    genres: i.Genres?.length ? i.Genres : undefined,
    played: i.UserData?.Played,
    fav: i.UserData?.IsFavorite,
    plays: i.UserData?.PlayCount,
    unplayed: i.UserData?.UnplayedItemCount,
  })), 'items');
}

/**
 * Produces the validated format item result used by CLI automation.
 * @param item - The item value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatItem(item: BaseItemDto): string {
  return formatToon({
    id: item.Id,
    name: item.Name,
    type: item.Type,
    path: item.Path,
    year: item.ProductionYear,
    rated: item.OfficialRating,
    rating: item.CommunityRating,
    critics: item.CriticRating,
    rt: item.RunTimeTicks,
    status: item.Status,
    premiered: item.PremiereDate,
    ended: item.EndDate,
    genres: item.Genres?.length ? item.Genres : undefined,
    studios: item.Studios?.map(s => s.Name),
    people: item.People?.slice(0, 10).map(p => ({
      name: p.Name,
      role: p.Role,
      type: p.Type,
    })),
    overview: item.Overview,
    taglines: item.Taglines?.length ? item.Taglines : undefined,
    sources: item.MediaSources?.map(s => ({
      id: s.Id,
      name: s.Name,
      container: s.Container,
      path: s.Path,
      bitrate: s.Bitrate,
      size: s.Size,
    })),
    streams: item.MediaStreams?.map(s => ({
      idx: s.Index,
      type: s.Type,
      codec: s.Codec,
      lang: s.Language,
      title: s.Title,
      w: s.Width,
      h: s.Height,
      ch: s.Channels,
      def: s.IsDefault,
      forced: s.IsForced,
    })),
    user: item.UserData ? {
      played: item.UserData.Played,
      fav: item.UserData.IsFavorite,
      plays: item.UserData.PlayCount,
      last: item.UserData.LastPlayedDate,
      pos: item.UserData.PlaybackPositionTicks,
    } : undefined,
    children: item.ChildCount,
    total: item.RecursiveItemCount,
  }, 'item');
}

/**
 * Produces the validated format query result result used by CLI automation.
 * @param result - The result value required by this operation.
 * @param itemFormatter - The item formatter value required by this operation.
 * @returns - The typed format query result result.
 */
export function formatQueryResult<T>(result: QueryResult<T>, itemFormatter?: (item: T) => unknown): string {
  return formatToon({
    total: result.TotalRecordCount,
    offset: result.StartIndex,
    items: itemFormatter && result.Items?.length 
      ? result.Items.map(itemFormatter).filter(Boolean)
      : result.Items,
  }, 'items');
}

/**
 * Produces the validated format search result result used by CLI automation.
 * @param result - The result value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatSearchResult(result: SearchResult): string {
  return formatToon({
    total: result.TotalRecordCount,
    hints: result.SearchHints?.map(h => ({
      id: h.Id,
      name: h.Name,
      type: h.Type,
      year: h.ProductionYear,
      rt: h.RunTimeTicks,
      media: h.MediaType,
      series: h.Series,
      album: h.Album,
      ep: h.IndexNumber,
      s: h.ParentIndexNumber,
    })),
  }, 'search');
}

/**
 * Produces the validated format libraries result used by CLI automation.
 * @param libraries - The libraries value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatLibraries(libraries: LibraryVirtualFolder[]): string {
  return formatToon(libraries.map(l => ({
    name: l.Name,
    id: l.ItemId,
    type: l.CollectionType,
    paths: l.Locations?.length ? l.Locations : undefined,
    status: l.RefreshStatus,
  })), 'libs');
}

/**
 * Produces the validated format activity log result used by CLI automation.
 * @param log - The log value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatActivityLog(log: ActivityLogEntry[]): string {
  return formatToon(log.map(e => ({
    type: e.Type,
    name: e.Name,
    user: e.UserId,
    when: e.Date,
    item: e.ItemId,
    lvl: e.Severity,
  })), 'activity');
}

/**
 * Produces the validated format live tv info result used by CLI automation.
 * @param info - The info value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatLiveTvInfo(info: LiveTvInfo): string {
  return formatToon({
    enabled: info.IsEnabled,
    services: info.Services?.map(s => ({
      name: s.Name,
      status: s.Status,
      ver: s.Version,
    })),
  }, 'livetv');
}
