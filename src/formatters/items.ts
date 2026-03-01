import type { BaseItemDto, QueryResult, SearchResult, ActivityLogEntry, LibraryVirtualFolder, LiveTvInfo } from '../types/index.js';
import { formatToon } from './base.js';

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

export function formatQueryResult<T>(result: QueryResult<T>, itemFormatter?: (item: T) => unknown): string {
  return formatToon({
    total: result.TotalRecordCount,
    offset: result.StartIndex,
    items: itemFormatter && result.Items?.length 
      ? result.Items.map(itemFormatter).filter(Boolean)
      : result.Items,
  }, 'items');
}

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

export function formatLibraries(libraries: LibraryVirtualFolder[]): string {
  return formatToon(libraries.map(l => ({
    name: l.Name,
    id: l.ItemId,
    type: l.CollectionType,
    paths: l.Locations?.length ? l.Locations : undefined,
    status: l.RefreshStatus,
  })), 'libs');
}

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
