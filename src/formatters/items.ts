import type { BaseItemDto, QueryResult, SearchResult, ActivityLogEntry, LibraryVirtualFolder, LiveTvInfo } from '../types/index.js';
import { formatToon } from './base.js';

export function formatItems(items: BaseItemDto[]): string {
  const simplified = items.map((item) => ({
    id: item.Id,
    name: item.Name,
    type: item.Type,
    year: item.ProductionYear,
    rating: item.CommunityRating,
    runtime_ticks: item.RunTimeTicks,
    genres: item.Genres,
    overview: item.Overview?.slice(0, 200),
    played: item.UserData?.Played,
    favorite: item.UserData?.IsFavorite,
    play_count: item.UserData?.PlayCount,
    unplayed_count: item.UserData?.UnplayedItemCount,
  }));
  return formatToon(simplified, 'items');
}

export function formatItem(item: BaseItemDto): string {
  const simplified = {
    id: item.Id,
    name: item.Name,
    type: item.Type,
    path: item.Path,
    year: item.ProductionYear,
    official_rating: item.OfficialRating,
    community_rating: item.CommunityRating,
    critic_rating: item.CriticRating,
    runtime_ticks: item.RunTimeTicks,
    status: item.Status,
    premiere_date: item.PremiereDate,
    end_date: item.EndDate,
    genres: item.Genres,
    studios: item.Studios?.map((s) => s.Name),
    people: item.People?.slice(0, 10).map((p) => ({ name: p.Name, role: p.Role, type: p.Type })),
    overview: item.Overview,
    taglines: item.Taglines,
    media_sources: item.MediaSources?.map((s) => ({
      id: s.Id,
      name: s.Name,
      container: s.Container,
      path: s.Path,
      bitrate: s.Bitrate,
      size: s.Size,
    })),
    media_streams: item.MediaStreams?.map((s) => ({
      index: s.Index,
      type: s.Type,
      codec: s.Codec,
      language: s.Language,
      title: s.Title,
      is_default: s.IsDefault,
      is_forced: s.IsForced,
      width: s.Width,
      height: s.Height,
      channels: s.Channels,
    })),
    user_data: item.UserData ? {
      played: item.UserData.Played,
      favorite: item.UserData.IsFavorite,
      play_count: item.UserData.PlayCount,
      last_played: item.UserData.LastPlayedDate,
      position_ticks: item.UserData.PlaybackPositionTicks,
    } : undefined,
    child_count: item.ChildCount,
    recursive_item_count: item.RecursiveItemCount,
  };
  return formatToon(simplified, 'item');
}

export function formatQueryResult<T>(result: QueryResult<T>, itemFormatter?: (item: T) => unknown): string {
  const data = {
    total_count: result.TotalRecordCount,
    start_index: result.StartIndex,
    items: itemFormatter && result.Items ? result.Items.map(itemFormatter) : result.Items,
  };
  return formatToon(data, 'query_result');
}

export function formatSearchResult(result: SearchResult): string {
  const simplified = {
    total_count: result.TotalRecordCount,
    hints: result.SearchHints?.map((h) => ({
      id: h.Id,
      name: h.Name,
      type: h.Type,
      year: h.ProductionYear,
      runtime_ticks: h.RunTimeTicks,
      media_type: h.MediaType,
      series: h.Series,
      album: h.Album,
      artists: h.Artists,
      index: h.IndexNumber,
      parent_index: h.ParentIndexNumber,
    })),
  };
  return formatToon(simplified, 'search_result');
}

export function formatLibraries(libraries: LibraryVirtualFolder[]): string {
  const simplified = libraries.map((lib) => ({
    name: lib.Name,
    id: lib.ItemId,
    collection_type: lib.CollectionType,
    locations: lib.Locations,
    refresh_status: lib.RefreshStatus,
  }));
  return formatToon(simplified, 'libraries');
}

export function formatActivityLog(log: ActivityLogEntry[]): string {
  const simplified = log.map((entry) => ({
    id: entry.Id,
    name: entry.Name,
    type: entry.Type,
    overview: entry.Overview,
    short_overview: entry.ShortOverview,
    user_id: entry.UserId,
    date: entry.Date,
    item_id: entry.ItemId,
    item_name: entry.ItemName,
    severity: entry.Severity,
  }));
  return formatToon(simplified, 'activity_log');
}

export function formatLiveTvInfo(info: LiveTvInfo): string {
  const simplified = {
    is_enabled: info.IsEnabled,
    enabled_users: info.EnabledUsers,
    services: info.Services?.map((s) => ({
      name: s.Name,
      status: s.Status,
      status_message: s.StatusMessage,
      version: s.Version,
      has_update: s.HasUpdateAvailable,
      is_visible: s.IsVisible,
      tuners: s.Tuners,
    })),
  };
  return formatToon(simplified, 'live_tv_info');
}
