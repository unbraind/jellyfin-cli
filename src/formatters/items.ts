import type { BaseItemDto, QueryResult, SearchResult, ActivityLogEntry, LibraryVirtualFolder, LiveTvInfo } from '../types/index.js';
import { formatToon } from './base.js';

export function formatItems(items: BaseItemDto[]): string {
  const simplified = items.map((item) => {
    const obj: Record<string, unknown> = {
      id: item.Id,
      name: item.Name,
      type: item.Type,
    };
    if (item.ProductionYear) obj.year = item.ProductionYear;
    if (item.CommunityRating) obj.rating = item.CommunityRating;
    if (item.RunTimeTicks) obj.rt = item.RunTimeTicks;
    if (item.Genres?.length) obj.genres = item.Genres;
    if (item.UserData?.Played !== undefined) obj.played = item.UserData.Played;
    if (item.UserData?.IsFavorite !== undefined) obj.fav = item.UserData.IsFavorite;
    if (item.UserData?.PlayCount) obj.plays = item.UserData.PlayCount;
    if (item.UserData?.UnplayedItemCount) obj.unplayed = item.UserData.UnplayedItemCount;
    return obj;
  });
  return formatToon(simplified, 'items');
}

export function formatItem(item: BaseItemDto): string {
  const obj: Record<string, unknown> = {
    id: item.Id,
    name: item.Name,
    type: item.Type,
  };
  if (item.Path) obj.path = item.Path;
  if (item.ProductionYear) obj.year = item.ProductionYear;
  if (item.OfficialRating) obj.rated = item.OfficialRating;
  if (item.CommunityRating) obj.rating = item.CommunityRating;
  if (item.CriticRating) obj.critics = item.CriticRating;
  if (item.RunTimeTicks) obj.rt = item.RunTimeTicks;
  if (item.Status) obj.status = item.Status;
  if (item.PremiereDate) obj.premiered = item.PremiereDate;
  if (item.EndDate) obj.ended = item.EndDate;
  if (item.Genres?.length) obj.genres = item.Genres;
  if (item.Studios?.length) obj.studios = item.Studios.map(s => s.Name);
  if (item.People?.length) {
    obj.people = item.People.slice(0, 10).map(p => {
      const person: Record<string, unknown> = { name: p.Name };
      if (p.Role) person.role = p.Role;
      if (p.Type) person.type = p.Type;
      return person;
    });
  }
  if (item.Overview) obj.overview = item.Overview;
  if (item.Taglines?.length) obj.taglines = item.Taglines;
  if (item.MediaSources?.length) {
    obj.sources = item.MediaSources.map(s => {
      const src: Record<string, unknown> = { id: s.Id };
      if (s.Name) src.name = s.Name;
      if (s.Container) src.container = s.Container;
      if (s.Path) src.path = s.Path;
      if (s.Bitrate) src.bitrate = s.Bitrate;
      if (s.Size) src.size = s.Size;
      return src;
    });
  }
  if (item.MediaStreams?.length) {
    obj.streams = item.MediaStreams.map(s => {
    const stream: Record<string, unknown> = { idx: s.Index, type: s.Type };
    if (s.Codec) stream.codec = s.Codec;
    if (s.Language) stream.lang = s.Language;
    if (s.Title) stream.title = s.Title;
    if (s.Width) stream.w = s.Width;
    if (s.Height) stream.h = s.Height;
    if (s.Channels) stream.ch = s.Channels;
    if (s.IsDefault) stream.def = true;
    if (s.IsForced) stream.forced = true;
    return stream;
    });
  }
  if (item.UserData) {
    const ud: Record<string, unknown> = {};
    if (item.UserData.Played !== undefined) ud.played = item.UserData.Played;
    if (item.UserData.IsFavorite !== undefined) ud.fav = item.UserData.IsFavorite;
    if (item.UserData.PlayCount) ud.plays = item.UserData.PlayCount;
    if (item.UserData.LastPlayedDate) ud.last = item.UserData.LastPlayedDate;
    if (item.UserData.PlaybackPositionTicks) ud.pos = item.UserData.PlaybackPositionTicks;
    if (Object.keys(ud).length > 0) obj.user = ud;
  }
  if (item.ChildCount) obj.children = item.ChildCount;
  if (item.RecursiveItemCount) obj.total = item.RecursiveItemCount;
  return formatToon(obj, 'item');
}

export function formatQueryResult<T>(result: QueryResult<T>, itemFormatter?: (item: T) => unknown): string {
  const obj: Record<string, unknown> = { total: result.TotalRecordCount };
  if (result.StartIndex) obj.offset = result.StartIndex;
  if (itemFormatter && result.Items?.length) {
    obj.items = result.Items.map(itemFormatter).filter(Boolean);
  } else if (result.Items?.length) {
    obj.items = result.Items;
  }
  return formatToon(obj, 'items');
}

export function formatSearchResult(result: SearchResult): string {
  const obj: Record<string, unknown> = {};
  if (result.TotalRecordCount) obj.total = result.TotalRecordCount;
  if (result.SearchHints?.length) {
    obj.hints = result.SearchHints.map(h => {
      const hint: Record<string, unknown> = { id: h.Id, name: h.Name, type: h.Type };
      if (h.ProductionYear) hint.year = h.ProductionYear;
      if (h.RunTimeTicks) hint.rt = h.RunTimeTicks;
      if (h.MediaType) hint.media = h.MediaType;
      if (h.Series) hint.series = h.Series;
      if (h.Album) hint.album = h.Album;
      if (h.IndexNumber) hint.ep = h.IndexNumber;
      if (h.ParentIndexNumber) hint.s = h.ParentIndexNumber;
      return hint;
    });
  }
  return formatToon(obj, 'search');
}

export function formatLibraries(libraries: LibraryVirtualFolder[]): string {
  const simplified = libraries.map(lib => {
    const obj: Record<string, unknown> = { name: lib.Name, id: lib.ItemId };
    if (lib.CollectionType) obj.type = lib.CollectionType;
    if (lib.Locations?.length) obj.paths = lib.Locations;
    if (lib.RefreshStatus) obj.status = lib.RefreshStatus;
    return obj;
  });
  return formatToon(simplified, 'libs');
}

export function formatActivityLog(log: ActivityLogEntry[]): string {
  const simplified = log.map(entry => {
    const obj: Record<string, unknown> = { type: entry.Type };
    if (entry.Name) obj.name = entry.Name;
    if (entry.UserId) obj.user = entry.UserId;
    if (entry.Date) obj.when = entry.Date;
    if (entry.ItemId) obj.item = entry.ItemId;
    if (entry.Severity) obj.lvl = entry.Severity;
    return obj;
  });
  return formatToon(simplified, 'activity');
}

export function formatLiveTvInfo(info: LiveTvInfo): string {
  const obj: Record<string, unknown> = {};
  if (info.IsEnabled !== undefined) obj.enabled = info.IsEnabled;
  if (info.Services?.length) {
    obj.services = info.Services.map(s => {
      const svc: Record<string, unknown> = { name: s.Name };
      if (s.Status) svc.status = s.Status;
      if (s.Version) svc.ver = s.Version;
      return svc;
    });
  }
  return formatToon(obj, 'livetv');
}
