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
    runtime_ticks: i.RunTimeTicks,
    genres: i.Genres?.length ? i.Genres : undefined,
    played: i.UserData?.Played,
    favorite: i.UserData?.IsFavorite,
    play_count: i.UserData?.PlayCount,
    unplayed_count: i.UserData?.UnplayedItemCount,
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
    official_rating: item.OfficialRating,
    rating: item.CommunityRating,
    critic_rating: item.CriticRating,
    runtime_ticks: item.RunTimeTicks,
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
    media_sources: item.MediaSources?.map(s => ({
      id: s.Id,
      name: s.Name,
      container: s.Container,
      path: s.Path,
      bitrate: s.Bitrate,
      size: s.Size,
    })),
    media_streams: item.MediaStreams?.map(s => ({
      index: s.Index,
      type: s.Type,
      codec: s.Codec,
      language: s.Language,
      title: s.Title,
      width: s.Width,
      height: s.Height,
      channels: s.Channels,
      default: s.IsDefault,
      forced: s.IsForced,
    })),
    user_data: item.UserData ? {
      played: item.UserData.Played,
      favorite: item.UserData.IsFavorite,
      play_count: item.UserData.PlayCount,
      last_played: item.UserData.LastPlayedDate,
      playback_position_ticks: item.UserData.PlaybackPositionTicks,
    } : undefined,
    children: item.ChildCount,
    recursive_item_count: item.RecursiveItemCount,
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
    total_count: result.TotalRecordCount,
    offset: result.StartIndex,
    items: itemFormatter && result.Items?.length 
      ? result.Items.map(itemFormatter).filter(Boolean)
      : result.Items,
  }, 'query_result');
}

/**
 * Produces the validated format search result result used by CLI automation.
 * @param result - The result value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatSearchResult(result: SearchResult): string {
  return formatToon({
    total_count: result.TotalRecordCount,
    hints: result.SearchHints?.map(h => ({
      id: h.Id,
      name: h.Name,
      type: h.Type,
      year: h.ProductionYear,
      runtime_ticks: h.RunTimeTicks,
      media_type: h.MediaType,
      series: h.Series,
      album: h.Album,
      episode: h.IndexNumber,
      season: h.ParentIndexNumber,
    })),
  }, 'search_result');
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
    collection_type: l.CollectionType,
    paths: l.Locations?.length ? l.Locations : undefined,
    status: l.RefreshStatus,
  })), 'libraries');
}

/**
 * Produces the validated format activity log result used by CLI automation.
 * @param log - The log value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatActivityLog(log: ActivityLogEntry[]): string {
  return formatToon(log.map(e => ({
    id: e.Id,
    type: e.Type,
    name: e.Name,
    user_id: e.UserId,
    date: e.Date,
    item_id: e.ItemId,
    severity: e.Severity,
  })), 'activity_log');
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
