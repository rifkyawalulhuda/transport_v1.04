# Graph Report - E:/Github/transport_v1.04  (2026-08-05)

## Corpus Check
- Large corpus: 550 files · ~949,200 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 4848 nodes · 9213 edges · 252 communities (203 shown, 49 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 239 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Wialon GPS & Tracking Routes
- Vue 3 Core Reactivity (VitePress)
- Sales Cost / SPK Module
- VitePress Cache Deps A
- VitePress Cache Deps B
- Frontend App Shell & Charts
- Geofence & List Query Composables
- BBS Safety Module
- VitePress Async Utils
- VitePress MiniSearch
- Toast & UI Components
- API Config & Address Book
- Vue DevTools API
- Sales Cost Form Components
- Vue Lifecycle Hooks (VitePress)
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 242
- Community 245
- Community 249
- Community 250
- Community 251

## God Nodes (most connected - your core abstractions)
1. `shallowRef()` - 100 edges
2. `authFetch()` - 98 edges
3. `toValue()` - 84 edges
4. `computed()` - 84 edges
5. `watch()` - 75 edges
6. `watch2()` - 67 edges
7. `useEventListener()` - 63 edges
8. `warn$1()` - 61 edges
9. `baseCreateRenderer()` - 54 edges
10. `useToast()` - 51 edges

## Surprising Connections (you probably didn't know these)
- `useSidebar()` --indirect_call--> `close()`  [INFERRED]
  docs/.vitepress/cache/deps/@theme_index.js → tailadmin-vuejs-1.0.0/src/components/SearchableSelect.vue
- `useFullscreen()` --indirect_call--> `toggle()`  [INFERRED]
  docs/.vitepress/cache/deps/chunk-4USRTV5H.js → tailadmin-vuejs-1.0.0/src/components/SearchableSelect.vue
- `useSidebar()` --indirect_call--> `toggle()`  [INFERRED]
  docs/.vitepress/cache/deps/@theme_index.js → tailadmin-vuejs-1.0.0/src/components/SearchableSelect.vue
- `useToggle()` --indirect_call--> `toggle()`  [INFERRED]
  docs/.vitepress/cache/deps/chunk-4USRTV5H.js → tailadmin-vuejs-1.0.0/src/components/SearchableSelect.vue
- `inspectComponentHighLighter()` --indirect_call--> `onSelect()`  [INFERRED]
  docs/.vitepress/cache/deps/vitepress___@vue_devtools-api.js → tailadmin-vuejs-1.0.0/src/components/common/TruckAutocomplete.vue

## Import Cycles
- None detected.

## Communities (252 total, 49 thin omitted)

### Community 0 - "Wialon GPS & Tracking Routes"
Cohesion: 0.05
Nodes (77): { authenticateToken }, express, {
  getTruckLocations,
  getTruckMonthlyDistance,
  getTruckMonthlyDistanceExportRows,
  reverseGeocodeCoordinates,
  autoMapTruckWialonUnits,
  fetchWialonGeofences
}, router, { runBackfill }, xlsx, autoMapTruckWialonUnits(), buildMileageRowWithoutTrips() (+69 more)

### Community 1 - "Vue 3 Core Reactivity (VitePress)"
Cohesion: 0.05
Nodes (62): assertNumber(), assertType(), autoPrefix(), batch(), cleanupDeps(), cleanupEffect(), createDevtoolsComponentHook(), createDevtoolsPerformanceHook() (+54 more)

### Community 2 - "Sales Cost / SPK Module"
Cohesion: 0.03
Nodes (65): actionMenuPosition, actionMenuRef, actionMenuStyle, areas, { confirm, alert }, currentPage, currentPageTitle, currentYear (+57 more)

### Community 3 - "VitePress Cache Deps A"
Cohesion: 0.05
Nodes (62): blobToBase64(), checkOverflowScroll(), computedInject(), createCalculateRange(), createComputedTotalSize(), createEasingFunction(), createGetDistance(), createGetOffset() (+54 more)

### Community 4 - "VitePress Cache Deps B"
Cohesion: 0.05
Nodes (68): cloneFnJSON(), computedWithControl(), createFilterWrapper(), createInjectionState(), createKeyPredicate(), createReusableTemplate(), createSingletonPromise(), debounceFilter() (+60 more)

### Community 5 - "Frontend App Shell & Charts"
Cohesion: 0.04
Nodes (41): chartOptions, series, chartOptions, series, Props, BreadcrumbProps, { isExpanded, isHovered }, { toggleMobileSidebar, isMobileOpen } (+33 more)

### Community 6 - "Geofence & List Query Composables"
Cohesion: 0.04
Nodes (55): loadGeofences(), filterItemsByQuery(), ListQueryOptions, useListQuery(), authFetch(), doExportSP(), loadGeofences(), { confirm } (+47 more)

### Community 7 - "BBS Safety Module"
Cohesion: 0.04
Nodes (55): checkedPlates, chkOpts, chkPlateDropOpen, chkPlateRoot, chkPlateSearch, { confirm }, deleting, detail (+47 more)

### Community 8 - "VitePress Async Utils"
Cohesion: 0.06
Nodes (64): computedAsync(), computedEager(), containsProp(), createFetch(), createUnrefFn(), findLast(), formatDate(), formatOrdinal() (+56 more)

### Community 9 - "VitePress MiniSearch"
Cohesion: 0.06
Nodes (51): add(), addAll(), addAllAsync(), addDocumentId(), addFieldLength(), addFields(), addTerm(), atPrefix() (+43 more)

### Community 10 - "Toast & UI Components"
Cohesion: 0.04
Nodes (47): dismiss(), chartOptions, currentYear, fetchMonthlyTransactions(), loading, monthLabels, now, numberFormatter (+39 more)

### Community 11 - "API Config & Address Book"
Cohesion: 0.05
Nodes (32): API_BASE, API_ORIGIN, authUser, clearAuth(), getToken(), initAuth(), login(), logout() (+24 more)

### Community 12 - "Vue DevTools API"
Cohesion: 0.04
Nodes (24): addCustomCommand(), addCustomTab(), createDefaultSetCallback(), createDevToolsApi(), createRect(), filterCurrentRoute(), filterRoutes(), getComponentInspector() (+16 more)

### Community 13 - "Sales Cost Form Components"
Cohesion: 0.03
Nodes (40): areaAutoPopulating, AreaOption, areas, checkingTruckStatus, currentSalesCostId, CustomerOption, customers, dateOrderErrors (+32 more)

### Community 14 - "Vue Lifecycle Hooks (VitePress)"
Cohesion: 0.07
Nodes (60): applyOptions(), callHook(), callWithAsyncErrorHandling(), callWithErrorHandling(), createComponentInstance(), createDevRenderContext(), createDuplicateChecker(), createSetupContext() (+52 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (59): cloneVNode(), closeBlock(), concat(), createBlock(), createCommentVNode(), createElementBlock(), createSlots(), createStaticVNode() (+51 more)

### Community 16 - "Community 16"
Cohesion: 0.03
Nodes (51): backfillStopResult, backfillStopStatus, checkInModal, currentPage, currentPageTitle, deliveryStopsWithHistory, detail, DetailData (+43 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (59): createRef(), pausableFilter(), toRef2(), tryOnScopeDispose(), useBattery(), useBroadcastChannel(), useClipboard(), useClipboardItems() (+51 more)

### Community 18 - "Community 18"
Cohesion: 0.04
Nodes (41): allExpanded, authUser, completingIds, confirmCompleteRow, currentPage, currentPageTitle, DeliveryStopSummary, DnItem (+33 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (48): callNoMatchOnInvalidRanges(), checkIframeFilter(), checkRanges(), checkWhitespaceRanges(), compareNodeIframe(), createAccuracyRegExp(), createDiacriticsRegExp(), createInstanceOnIframe() (+40 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (45): activeGpsFilterLabel, addressCache, AddressCacheEntry, AddressCacheStoragePayload, ClusterStatusSummary, debouncedSyncOnSearch, defaultCenter, detailPanelVisible (+37 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (51): createUntil(), onClickOutside(), onElementRemoval(), onLongPress(), refDebounced(), syncRefs(), toArray(), tryOnMounted() (+43 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (42): isProfileAddressModal, isProfileInfoModal, isProfileInfoModal, authUser, calendarOptions, calendarRef, calendarsEvents, closeModal() (+34 more)

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (42): addDnItem(), addMiddleStop(), applyInitialData(), buildPayload(), clearErrors(), CustomerOption, customers, dateOnlyFromDt() (+34 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (42): actionMenuPosition, actionMenuRef, actionMenuStyle, { confirm }, currentPage, currentPageTitle, currentYear, defaultYear (+34 more)

### Community 25 - "Community 25"
Cohesion: 0.05
Nodes (41): addRouteStep(), AreaItem, areaNamePreview, { confirm }, createEmptyFinishGeofence(), createEmptyRouteStep(), currentPageTitle, deletingId (+33 more)

### Community 26 - "Community 26"
Cohesion: 0.04
Nodes (41): actionMenuPosition, actionMenuRef, actionMenuStyle, { confirm }, currentPage, currentPageTitle, currentYear, defaultYear (+33 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (40): { authenticateToken }, bcrypt, { createNotification, getActorFromRequest }, db, express, notifyMasterChange(), router, notifyMasterChange() (+32 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (45): startServer(), AGE_FINISH_DAYS_FALLBACK, AGE_FINISH_DAYS_LONG, AGE_FINISH_DAYS_MID, AGE_FINISH_DAYS_SHORT, AGE_FINISH_LOOKBACK_DAYS, AGE_FINISH_MID_KM, AGE_FINISH_SHORT_KM (+37 more)

### Community 30 - "Community 30"
Cohesion: 0.06
Nodes (38): alert(), AlertOptions, applyRequest(), closeDialog(), confirm(), ConfirmOptions, dialogHandlers, DialogRequest (+30 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (44): assert, BASE_POLY, {
  buildZoneEntryTimeline,
  seedConsumptionFromHistory,
  assignStopHits,
  resolveFinishGpsHit,
  analyzeBaseExit,
  computeTripDistanceKm,
  resolveAgeFinishDays,
  isDueForAgeFinish
}, fullTimeline, main(), makeStops(), testAnalyzeBaseExitShortBlip(), testBuildTimelineReentry() (+36 more)

### Community 32 - "Community 32"
Cohesion: 0.05
Nodes (35): emit, goToPage(), PaginationItem, paginationItems, Props, safeTotalPages, DeliveryTemplate, deliveryTemplateService (+27 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (35): applyBreakdown(), breakdown, BreakdownCounts, breakdownEstimated, categoryRows, computeBreakdownFromItems(), counts, currentPage (+27 more)

### Community 34 - "Community 34"
Cohesion: 0.06
Nodes (40): actionMenuPosition, actionMenuRef, actionMenuStyle, autoMapWialonUnits(), closeActionMenu(), { confirm }, currentPageTitle, deletingId (+32 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (43): addSub(), apply(), checkIdentityKeys(), constructor(), createInstrumentationGetter(), createInstrumentations(), createIterableMethod(), createReadonlyMethod() (+35 more)

### Community 36 - "Community 36"
Cohesion: 0.05
Nodes (34): actionMenuPosition, actionMenuRef, actionMenuStyle, authUser, canAdd, canDelete, canEdit, closeActionMenu() (+26 more)

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (40): getTokenFromHeader(), isAllowedForCs(), isAllowedForPatcher(), jwt, restrictCsAccess(), restrictPatcherAccess(), addressBookRouter, adminRouter (+32 more)

### Community 38 - "Community 38"
Cohesion: 0.05
Nodes (28): actionMenuPosition, actionMenuRef, actionMenuStyle, authUser, canEdit, closeActionMenu(), currentPage, filteredItems (+20 more)

### Community 39 - "Community 39"
Cohesion: 0.05
Nodes (32): activeRange, categories, chartOptions, currentDate, currentYear, handlePrintRingkasan(), isPrinting, loading (+24 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (38): actionMenuPosition, actionMenuRef, actionMenuStyle, closeActionMenu(), { confirm }, currentPageTitle, deletingId, DriverItem (+30 more)

### Community 41 - "Community 41"
Cohesion: 0.06
Nodes (31): { authenticateToken, requireAdmin }, {
  buildPlannedPolygon,
  DEFAULT_POLYGON_MAX_POINTS
}, {
  buildZoneEntryTimeline,
  assignStopHits,
  toMySqlDateTime
}, { createNotification, getActorFromRequest }, db, DEFAULT_FINISH_GEOFENCE_NAME, ExcelJS, express (+23 more)

### Community 42 - "Community 42"
Cohesion: 0.05
Nodes (38): bcrypt, cors, dbmate, dotenv, exceljs, express, jsonwebtoken, mongoose (+30 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (39): addEventListener(), addTransitionClass(), applyTranslation(), callPendingCbs(), createInvoker(), createRecord(), dep(), findNonCommentChild() (+31 more)

### Community 44 - "Community 44"
Cohesion: 0.05
Nodes (39): eslint, eslint-plugin-vue, jiti, npm-run-all2, postcss, prettier, sass-embedded, devDependencies (+31 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (32): ariaSort, isActive, props, collator, normalizeSortValue(), SortAccessors, SortDirection, useSortableItems() (+24 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (32): activeChkTab, allItemIds, allValues, answeredCount, checkedPlates, checkItems, chkData, chkOptions (+24 more)

### Community 47 - "Community 47"
Cohesion: 0.07
Nodes (31): activeRange, categories, chartOptions, currentYear, fetchStatistics(), fetchSubcontractorStatistics(), getDefaultCategories(), getSubcontractorDefaultCategories() (+23 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (27): actionMenuPosition, actionMenuRef, actionMenuStyle, authUser, closeActionMenu(), currentPage, filteredItems, handleDocumentClick() (+19 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (28): clear(), emit, onInput(), Props, { confirm }, currentPageTitle, CustomerItem, deletingId (+20 more)

### Community 50 - "Community 50"
Cohesion: 0.06
Nodes (33): apexcharts, dropzone, flatpickr, @fullcalendar/list, @fullcalendar/vue3, @headlessui/vue, leaflet, lucide-vue-next (+25 more)

### Community 51 - "Community 51"
Cohesion: 0.10
Nodes (29): activeIdx, closeSuggestions(), defaultCenter, emit, fetchSuggestions(), geolocating, handleClickOutside(), handleDirectSearch() (+21 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (27): activeFilter, applyFilters(), clearFilters(), currentMonth(), currentPage, doExport(), emit, exporting (+19 more)

### Community 53 - "Community 53"
Cohesion: 0.09
Nodes (27): fetchLatest(), fetchRepairNotifications(), handleMarkAllRead(), deleteAll(), deleteMany(), fetchNotifications(), isFetching, markAllRead() (+19 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (21): activeFilter, applyFilter(), fetchMonitoring(), filterMonth, filterYear, lastRefreshedAt, loading, monitoringData (+13 more)

### Community 55 - "Community 55"
Cohesion: 0.06
Nodes (28): badgeClasses, currentYear, fetchSalesCount(), fetchSubcontractorCount(), formattedSalesCount, formattedSubcontractorCount, monthOptions, now (+20 more)

### Community 56 - "Community 56"
Cohesion: 0.10
Nodes (27): activeIndex, asyncOptions, baseOptions, close(), debouncedQuery, emit, filteredOptions, getOptionKey() (+19 more)

### Community 57 - "Community 57"
Cohesion: 0.07
Nodes (17): errorMessage, loading, nikAdmin, password, router, showPassword, email, keepLoggedIn (+9 more)

### Community 58 - "Community 58"
Cohesion: 0.07
Nodes (20): dataChasisSchema, mongoose, { authenticateToken }, DataChasis, DataSupir, DataTruck, db, express (+12 more)

### Community 59 - "Community 59"
Cohesion: 0.07
Nodes (22): avgPercent, clampCurrentPage(), currentPage, currentYear, displayedRows, fetchMonthlyAverage(), isPrintMode, loading (+14 more)

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (25): badgeClass, badgeClasses, badgeText, chartOptions, chartSeries, currentYear, fetchMonthlyTarget(), grossProfit (+17 more)

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (21): applyFilters(), changePageSize(), currentPage, distanceFormatter, exportExcel(), fetchMileage(), filteredRows, filteredSummary (+13 more)

### Community 62 - "Community 62"
Cohesion: 0.07
Nodes (26): avatarSrc, closeEdit(), currentPageTitle, displayEmail, displayId, displayJabatan, displayName, displayNik (+18 more)

### Community 63 - "Community 63"
Cohesion: 0.10
Nodes (28): keysToCamelKebabCase(), createHydrationFunctions(), createPropsRestProxy(), deleteProperty(), getEscapedCssVarName(), includeBooleanAttr(), includes(), isMapEqual() (+20 more)

### Community 64 - "Community 64"
Cohesion: 0.08
Nodes (21): { confirm }, docs, docsByType(), errors, form, formatDateForInput(), formError, getDateInputClass() (+13 more)

### Community 65 - "Community 65"
Cohesion: 0.08
Nodes (25): backfillCurrentStop, backfillDialog, BackfillStatus, BackfillStop, closeBackfillDialog(), { confirm }, currentPageTitle, deliveryDate (+17 more)

### Community 66 - "Community 66"
Cohesion: 0.09
Nodes (27): baseCreateRenderer(), _beginPatch(), cloneIfMounted(), createAppAPI(), createAppContext(), createHydrationRenderer(), createRenderer(), ensureHydrationRenderer() (+19 more)

### Community 67 - "Community 67"
Cohesion: 0.09
Nodes (21): authenticateToken(), getTokenFromHeader(), jwt, requireAdmin(), allowedMimeTypes, { authenticateToken }, bcrypt, db (+13 more)

### Community 68 - "Community 68"
Cohesion: 0.08
Nodes (20): acceptList, config, configLabel, emit, errorDetails, errorMessage, fileInputRef, hasExport (+12 more)

### Community 69 - "Community 69"
Cohesion: 0.09
Nodes (22): deliveryNotificationService, allSelected, applyFilter(), currentPage, DeliveryNotificationRow, fetchNotifications(), filters, goToPage() (+14 more)

### Community 70 - "Community 70"
Cohesion: 0.15
Nodes (23): { authenticateToken, requireAdmin }, { createNotification, getActorFromRequest }, ExcelJS, express, {
  fetchRepairs,
  fetchRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  fetchRepairsForExport,
  fetchRepairYears,
  fetchRepairProcessNotifications
}, router, buildFilters(), createRepair() (+15 more)

### Community 71 - "Community 71"
Cohesion: 0.09
Nodes (22): BbsChecklistInput, BbsDashboardResponse, BbsDashboardRisks, BbsDashboardSummary, BbsDashboardTrend, BbsHistoryResponse, BbsHistoryRow, BbsIncidentInput (+14 more)

### Community 72 - "Community 72"
Cohesion: 0.11
Nodes (25): checkRecursiveUpdates(), createPathGetter(), doWatch(), findInsertionIndex(), flushJobs(), flushPostFlushCbs(), flushPreFlushCbs(), getComponentTrace() (+17 more)

### Community 73 - "Community 73"
Cohesion: 0.08
Nodes (21): dataTruckSchema, mongoose, allowedDocFields, allowedMimeTypes, DataTruck, db, express, fs (+13 more)

### Community 74 - "Community 74"
Cohesion: 0.09
Nodes (19): authUser, currentUserId, dateTimeFormatter, displayEvents, endDate, events, filterOpen, filterSummary (+11 more)

### Community 75 - "Community 75"
Cohesion: 0.09
Nodes (15): BbsLang, BbsTranslationKey, currentLang, translations, useBbsLang(), activeTab, allTabs, authUser (+7 more)

### Community 76 - "Community 76"
Cohesion: 0.09
Nodes (18): { confirm }, docs, errors, form, formatDateForInput(), formError, getDateInputClass(), getDateStatusClass() (+10 more)

### Community 77 - "Community 77"
Cohesion: 0.09
Nodes (19): currentPageTitle, DeliveryStopRow, deliveryStops, detail, DetailData, detailId, dnError, DNItem (+11 more)

### Community 78 - "Community 78"
Cohesion: 0.15
Nodes (24): addInspector(), addTimelineLayer(), cancelInspectComponentHighLighter(), create(), createDevToolsCtxHooks(), createHooks(), getAppRecord(), getCardElement() (+16 more)

### Community 79 - "Community 79"
Cohesion: 0.11
Nodes (18): dnItemSchema, mongoose, salesCostDNSchema, { authenticateToken }, db, diffMinutes(), ExcelJS, express (+10 more)

### Community 80 - "Community 80"
Cohesion: 0.15
Nodes (23): connect(), ensureColumn(), ensureDatabaseExists(), ensureDirExists(), ensureForeignKey(), ensureMigrationTable(), ensureTable(), fs (+15 more)

### Community 81 - "Community 81"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx (+15 more)

### Community 82 - "Community 82"
Cohesion: 0.10
Nodes (18): subcontractorService, { confirm }, currentPageTitle, formError, handleSubmit(), initialData, isSubmitting, loadDetail() (+10 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (18): authUser, emit, factorOptions, filteredTrucks, form, incidentTypes, pickTruck(), plateActiveIdx (+10 more)

### Community 84 - "Community 84"
Cohesion: 0.10
Nodes (16): display, driverOptions, errors, form, formError, getDateInputClass(), getDateStatusClass(), handleSubmit() (+8 more)

### Community 85 - "Community 85"
Cohesion: 0.17
Nodes (20): {
  attachRouteStepsToAreas,
  parseLegacyAreaName,
  resolveAreaPayload
}, { authenticateToken }, buildDraftRouteSteps(), {
  createNotification,
  getActorFromRequest
}, db, express, loadAreaById(), loadAreas() (+12 more)

### Community 86 - "Community 86"
Cohesion: 0.11
Nodes (19): authUser, closeDropdown(), displayNotifications, dropdownOpen, dropdownRef, handleClickOutside(), handleItemClick(), handleViewAllClick() (+11 more)

### Community 87 - "Community 87"
Cohesion: 0.11
Nodes (19): activeIndex, closeDropdown(), handleClickOutside(), isOpen, menuGroups, navigateTo(), normalizedQuery, onFocus() (+11 more)

### Community 88 - "Community 88"
Cohesion: 0.10
Nodes (20): { confirm }, currentPageTitle, formError, handleSubmit(), initialData, isSubmitting, loadDetail(), loading (+12 more)

### Community 89 - "Community 89"
Cohesion: 0.13
Nodes (22): _applyStyles(), connectedCallback(), createBaseVNode(), createTextVNode(), _createVNode(), _endPatch(), _getRootStyleInsertionAnchor(), _getStyleAnchor() (+14 more)

### Community 90 - "Community 90"
Cohesion: 0.10
Nodes (15): DeliveryStop, detail, DNItem, dnItems, documentNumber, errorMessage, formatDate(), formatDateTime() (+7 more)

### Community 91 - "Community 91"
Cohesion: 0.16
Nodes (21): beforeMount(), beforeUnmount(), beforeUpdate(), callModelHook(), castValue(), created(), getCheckboxValue(), getValue() (+13 more)

### Community 92 - "Community 92"
Cohesion: 0.11
Nodes (15): DeliveryStopPrint, details, errorMessage, formatNumber(), getSpkCode(), getTotalCost(), getYear(), loadDetails() (+7 more)

### Community 93 - "Community 93"
Cohesion: 0.10
Nodes (15): dataSupirSchema, lisensiSchema, mongoose, allowedMimeTypes, DataSupir, db, express, fs (+7 more)

### Community 94 - "Community 94"
Cohesion: 0.13
Nodes (14): db, express, isNumericValue(), isRowEmpty(), multer, normalizeHeader(), normalizeNumeric(), normalizeValue() (+6 more)

### Community 95 - "Community 95"
Cohesion: 0.15
Nodes (19): abortController, AddressItem, closeDropdown(), debounceId, dropdownOpen, emit, fetchSuggestions(), handleDocumentClick() (+11 more)

### Community 96 - "Community 96"
Cohesion: 0.11
Nodes (14): avatarFallback, avatarUrl, closeDropdown(), displayName, displayRole, dropdownOpen, dropdownRef, handleClickOutside() (+6 more)

### Community 97 - "Community 97"
Cohesion: 0.11
Nodes (13): docs, errors, form, formError, getDateInputClass(), getDateStatusClass(), { isDarkMode }, isSubmitting (+5 more)

### Community 98 - "Community 98"
Cohesion: 0.17
Nodes (16): _arrayLikeToArray(), _arrayWithoutHoles(), _createForOfIteratorHelper(), _defineProperty(), _iterableToArray(), _nonIterableSpread(), _objectSpread2(), ownKeys() (+8 more)

### Community 99 - "Community 99"
Cohesion: 0.11
Nodes (18): cypress.config.*, eslint.config.*, nightwatch.conf.*, node, playwright.config.*, @tsconfig/node22/tsconfig.json, vite.config.*, vitest.config.* (+10 more)

### Community 100 - "Community 100"
Cohesion: 0.12
Nodes (18): addHooks(), componentAdded(), componentEmit(), componentRemoved(), deprecateHook(), deprecateHooks(), flatHooks(), hook() (+10 more)

### Community 101 - "Community 101"
Cohesion: 0.37
Nodes (17): columnExists(), columnType(), DRY_RUN, indexExists(), log(), main(), migration1_renameSalesCostTimeline(), migration2_createDeliveryNotifications() (+9 more)

### Community 102 - "Community 102"
Cohesion: 0.14
Nodes (14): closeDropdown(), dropdownOpen, dropdownRef, fetchNotifications(), handleClickOutside(), handleItemClick(), handleMarkAllRead(), loading (+6 more)

### Community 103 - "Community 103"
Cohesion: 0.12
Nodes (12): currentPageTitle, detail, formError, loadDetail(), loading, RepairDetail, resolveIdParam(), route (+4 more)

### Community 104 - "Community 104"
Cohesion: 0.13
Nodes (15): BbsDriverOption, authUser, drivers, emit, followUpOptions, form, observationItems, ratingOptions (+7 more)

### Community 105 - "Community 105"
Cohesion: 0.15
Nodes (17): buildClusterPopupContent(), buildPopupContent(), clusterStatusLabel(), createClusterIcon(), createTruckIcon(), escapeHtml(), formatNumber(), formatSpeed() (+9 more)

### Community 106 - "Community 106"
Cohesion: 0.17
Nodes (16): createReactiveObject(), getTargetType(), hasPropsChanged(), hasPropValueChanged(), initProps(), isEmitListener(), isInHmrContext(), isStatefulComponent() (+8 more)

### Community 107 - "Community 107"
Cohesion: 0.16
Nodes (11): mysql, pool, { authenticateToken }, db, express, { markRead, markAllRead, dismiss }, router, db (+3 more)

### Community 108 - "Community 108"
Cohesion: 0.14
Nodes (12): emit, okClass, Props, emit, handleClose(), handleKeydown(), Props, titleClass (+4 more)

### Community 109 - "Community 109"
Cohesion: 0.15
Nodes (12): applyInitialData(), emit, form, formatNumeric(), handleSubmit(), { isDarkMode }, isDisabled, normalizeDateInput() (+4 more)

### Community 110 - "Community 110"
Cohesion: 0.14
Nodes (10): currentPageTitle, detail, docs, formError, getDateStatusClass(), loadDetail(), loading, parseDateValue() (+2 more)

### Community 111 - "Community 111"
Cohesion: 0.14
Nodes (10): currentPageTitle, detail, docs, formError, getDateStatusClass(), loadDetail(), loading, parseDateValue() (+2 more)

### Community 112 - "Community 112"
Cohesion: 0.20
Nodes (13): { authenticateToken }, buildSearchable(), db, express, isZeroDate(), matchesSearch(), pad2(), parsePositiveInt() (+5 more)

### Community 113 - "Community 113"
Cohesion: 0.15
Nodes (9): { authenticateToken, requireAdmin }, { createNotification, getActorFromRequest }, db, ExcelJS, express, normalizeDeliveryStops(), router, toDateOnly() (+1 more)

### Community 114 - "Community 114"
Cohesion: 0.13
Nodes (14): name, private, scripts, build, build:gh-pages, build-only, deploy, dev (+6 more)

### Community 115 - "Community 115"
Cohesion: 0.18
Nodes (13): countdown(), daysArray, endTime, format(), getMaxValueForUnit(), getTimeArray(), hoursArray, minutesArray (+5 more)

### Community 116 - "Community 116"
Cohesion: 0.14
Nodes (10): authUser, dropdownOpen, isApplicationMenuOpen, isCs, isPatcher, notifying, { toggleSidebar, toggleMobileSidebar, isMobileOpen }, authUser (+2 more)

### Community 117 - "Community 117"
Cohesion: 0.14
Nodes (9): homePath, isActive(), isAdmin, isAnySubmenuRouteActive, { isExpanded, isMobileOpen, isHovered, openSubmenu }, isSubmenuOpen(), menuGroups, route (+1 more)

### Community 118 - "Community 118"
Cohesion: 0.14
Nodes (14): createEventHook(), getOldValue(), prepareInitialFiles(), timeRangeToArray(), tracksToArray(), useConfirmDialog(), useEventBus(), useFileDialog() (+6 more)

### Community 119 - "Community 119"
Cohesion: 0.14
Nodes (14): _applyPromised(), callEachWith(), callHook(), callHookParallel(), callHookWith(), componentUpdated(), debounce(), getActiveInspectors() (+6 more)

### Community 120 - "Community 120"
Cohesion: 0.14
Nodes (11): actorSchema, mongoose, notificationSchema, mongoose, notificationReadSchema, { authenticateToken }, express, mongoose (+3 more)

### Community 121 - "Community 121"
Cohesion: 0.18
Nodes (10): connect(), fs, getMigrationFiles(), getVersion(), main(), migrationChecks, migrationsDir, mysql (+2 more)

### Community 122 - "Community 122"
Cohesion: 0.26
Nodes (12): useToggle(), addBase(), buildTree(), ensureStartingSlash(), getHeaders(), getSidebar(), getSidebarGroups(), resolveHeaders() (+4 more)

### Community 123 - "Community 123"
Cohesion: 0.22
Nodes (12): ALLOWED_PREFIXES, baselinePath, extractCreateTableNames(), fs, includeData, keepStatement(), main(), migrationsDir (+4 more)

### Community 124 - "Community 124"
Cohesion: 0.35
Nodes (11): assert, main(), testBuildPlannedPolygon(), testRingSwapLatLon(), testSimplifyPreservesEnds(), testTooFewPointsNull(), {
  wialonPointsToLatLngRing,
  simplifyLatLngRing,
  buildPlannedPolygon
}, buildPlannedPolygon() (+3 more)

### Community 125 - "Community 125"
Cohesion: 0.22
Nodes (11): dateRef, dpValue, emit, onDateInput(), onDpChange(), onKeydown(), onTextBlur(), onTextInput() (+3 more)

### Community 126 - "Community 126"
Cohesion: 0.15
Nodes (9): copyText, countryCodes, email, phoneNumber, phoneNumber2, selectedCountry, selectedCountry2, url (+1 more)

### Community 127 - "Community 127"
Cohesion: 0.22
Nodes (13): applyGpsLayerVisibility(), closeCheckIn(), destroyGpsTrailMap(), formatUnixLocal(), loadDetail(), loadGpsTrail(), plannedStopKindLabel(), plannedStopStyle() (+5 more)

### Community 128 - "Community 128"
Cohesion: 0.17
Nodes (11): env.d.ts, src/**/*, src/**/__tests__/*, src/**/*.vue, @vue/tsconfig/tsconfig.dom.json, compilerOptions, paths, tsBuildInfoFile (+3 more)

### Community 129 - "Community 129"
Cohesion: 0.26
Nodes (9): app, inferPageTitle(), router, toTitleCase(), authService, applyRouteMeta(), setDocumentTitle(), upsertMetaByName() (+1 more)

### Community 130 - "Community 130"
Cohesion: 0.27
Nodes (12): alignSelectedTruck(), buildCoordinateCacheKey(), cancelPendingReveal(), focusSelectedTruckOnMap(), focusTruck(), formatCoordinates(), hasCoordinates(), loadSelectedTruckAddress() (+4 more)

### Community 131 - "Community 131"
Cohesion: 0.18
Nodes (10): devDependencies, vitepress, name, private, scripts, build, dev, preview (+2 more)

### Community 132 - "Community 132"
Cohesion: 0.18
Nodes (7): addressBookSchema, mongoose, AddressBook, { authenticateToken }, express, mongoose, router

### Community 133 - "Community 133"
Cohesion: 0.25
Nodes (10): encodeSegment(), ensureDatabaseExists(), main(), migrationsDir, mysql, path, projectRoot, resolveDatabaseUrl() (+2 more)

### Community 134 - "Community 134"
Cohesion: 0.22
Nodes (7): emit, isOpen, multiSelectRef, props, removeItem(), selectedItems, toggleItem()

### Community 135 - "Community 135"
Cohesion: 0.24
Nodes (11): buildFilterParams(), doExportModal(), downloadTemplate(), exportExcel(), getFilenameFromHeader(), handleFileChange(), handleYearFilterChange(), loadData() (+3 more)

### Community 136 - "Community 136"
Cohesion: 0.22
Nodes (10): applyReferentialEqualityAnnotations(), applyValueAnnotations(), deserialize(), forEach(), generateReferentialEqualityAnnotations(), "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/lib/speakingurl.js"(), parse(), serialize() (+2 more)

### Community 137 - "Community 137"
Cohesion: 0.22
Nodes (9): inspectComponentHighLighter(), emit, filteredTrucks, loading, onSelect(), props, query, selected (+1 more)

### Community 138 - "Community 138"
Cohesion: 0.44
Nodes (9): db, ensureAreaRouteSchema(), ensureDriverActiveColumn(), ensureTrackingSchema(), ensureTruckActiveColumn(), ensureTruckWialonColumn(), getDatabaseName(), hasColumn() (+1 more)

### Community 139 - "Community 139"
Cohesion: 0.20
Nodes (9): BadgeColor, BadgeProps, BadgeSize, BadgeVariant, colorStyles, props, sizeClass, sizeStyles (+1 more)

### Community 140 - "Community 140"
Cohesion: 0.25
Nodes (9): assignProp(), copy(), getType2(), includes(), isArray2(), isNull2(), isPlainObject3(), isUndefined2() (+1 more)

### Community 141 - "Community 141"
Cohesion: 0.25
Nodes (9): find(), findApplicable(), getInspector(), getPluginLocalKey(), getPluginSettings(), getPluginSettingsOptions(), _getSettings(), initPluginSettings() (+1 more)

### Community 142 - "Community 142"
Cohesion: 0.25
Nodes (7): { authenticateToken }, db, express, fmtDate(), pad2(), router, xlsx

### Community 143 - "Community 143"
Cohesion: 0.28
Nodes (8): fs, getConnectionConfig(), main(), mysql, outputPath, path, projectRoot, topoSortTables()

### Community 144 - "Community 144"
Cohesion: 0.44
Nodes (8): assert, { downsampleTrailPoints }, main(), makePoints(), testDownsamplePreservesEnds(), testEmpty(), testNoChangeWhenUnderMax(), downsampleTrailPoints()

### Community 145 - "Community 145"
Cohesion: 0.25
Nodes (4): closeDropdown(), handleMenuItemClick(), open, props

### Community 146 - "Community 146"
Cohesion: 0.22
Nodes (5): dropzoneForm, props, errorEmail, successEmail, currentPageTitle

### Community 147 - "Community 147"
Cohesion: 0.22
Nodes (7): TruckMileageMeta, TruckMileagePagination, TruckMileagePeriod, TruckMileageResponse, TruckMileageRow, truckMileageService, TruckMileageSummary

### Community 148 - "Community 148"
Cohesion: 0.28
Nodes (9): buildFilterParams(), doExportModal(), exportExcel(), getFilenameFromHeader(), handleDelete(), handleYearFilterChange(), loadData(), remove() (+1 more)

### Community 149 - "Community 149"
Cohesion: 0.29
Nodes (8): addIdentity(), clear(), get(), getComponentInstance(), isReactive(), isReadonly(), isRef(), set()

### Community 150 - "Community 150"
Cohesion: 0.29
Nodes (5): { toggleTheme }, isDarkMode, isInitialized, Theme, useTheme()

### Community 151 - "Community 151"
Cohesion: 0.29
Nodes (8): applyInitialData(), buildPayload(), formatIndonesianNumber(), formatNumeric(), generateRandomString(), getDefaultOrderDate(), normalizeDateTime(), parseIndonesianNumber()

### Community 152 - "Community 152"
Cohesion: 0.39
Nodes (8): hydrateAddressCache(), isAddressCacheEntryFresh(), isLocalStorageAvailable(), persistAddressCache(), readAddressCache(), rememberAddressCache(), removeAddressCache(), removeExpiredAddressCacheEntries()

### Community 153 - "Community 153"
Cohesion: 0.29
Nodes (7): API Surface (/api/*), Backfill Geofence Changed Stop Plan, Geofence Guards Documentation, Dual Database Architecture, Geofence Tuning Env Vars, geofenceTrackingService, System Architecture

### Community 154 - "Community 154"
Cohesion: 0.29
Nodes (7): callDevToolsPluginSetupFn(), getRoutes(), has(), registerDevToolsPlugin(), sendInspectorState(), toggleHighPerfMode(), updateDevToolsClientDetected()

### Community 156 - "Community 156"
Cohesion: 0.29
Nodes (6): date, flatpickrConfig, flatpickrTimeConfig, formData, showPassword, time

### Community 157 - "Community 157"
Cohesion: 0.43
Nodes (6): disableDevtools(), injectHideStyles(), isLocalHost(), LOCAL_HOSTNAMES, removeDevtoolsToggle(), Window

### Community 158 - "Community 158"
Cohesion: 0.29
Nodes (7): applyFilter(), buildParams(), changePageSize(), goToPage(), handleCompleteAll(), loadData(), toggleSort()

### Community 159 - "Community 159"
Cohesion: 0.38
Nodes (7): applyPlaybackFrame(), onPlaybackScrub(), playbackIntervalMs(), setPlaybackSpeed(), startGpsPlayback(), stopGpsPlayback(), toggleGpsPlayback()

### Community 160 - "Community 160"
Cohesion: 0.53
Nodes (5): connect(), main(), mark(), mysql, run()

### Community 161 - "Community 161"
Cohesion: 0.33
Nodes (5): options, optionss, selected, selectedItems, singleSelect

### Community 162 - "Community 162"
Cohesion: 0.40
Nodes (6): clearErrors(), emit, handleSubmit(), isValidIsoDateTime(), updateDateOrderErrors(), validateForm()

### Community 163 - "Community 163"
Cohesion: 0.33
Nodes (5): AvatarProps, props, sizeClasses, statusColorClasses, statusSizeClasses

### Community 164 - "Community 164"
Cohesion: 0.40
Nodes (6): buildFilterParams(), doExportModal(), exportExcel(), getFilenameFromHeader(), handleDelete(), remove()

### Community 165 - "Community 165"
Cohesion: 0.40
Nodes (6): fetchSubcontractorStatistics(), getSubcontractorDefaultCategories(), getSubcontractorMonthlyTotals(), normalizeSubcontractorSeries(), resetSubcontractorSeries(), sumSubcontractorSeries()

### Community 166 - "Community 166"
Cohesion: 0.40
Nodes (6): applyDetailToForm(), cancelForm(), ensureSelectedTruckOption(), openForm(), resetForm(), toDateInputValue()

### Community 167 - "Community 167"
Cohesion: 0.33
Nodes (6): closeActionMenu(), handleDelete(), handleDocumentClick(), handleWindowChange(), setActionMenuPosition(), toggleActionMenu()

### Community 168 - "Community 168"
Cohesion: 0.40
Nodes (5): OpenWiki Index, OpenWiki Key Workflows, OpenWiki Architecture Overview, Quickstart Guide, OpenWiki Operations Runbook

### Community 169 - "Community 169"
Cohesion: 0.40
Nodes (4): printWidth, $schema, semi, singleQuote

### Community 170 - "Community 170"
Cohesion: 0.40
Nodes (4): AlertProps, icons, props, variantClasses

### Community 171 - "Community 171"
Cohesion: 0.40
Nodes (5): closeActionMenu(), handleDocumentClick(), handleWindowChange(), setActionMenuPosition(), toggleActionMenu()

### Community 172 - "Community 172"
Cohesion: 0.40
Nodes (5): closeActionMenu(), handleDocumentClick(), handleWindowChange(), setActionMenuPosition(), toggleActionMenu()

### Community 173 - "Community 173"
Cohesion: 0.50
Nodes (4): Chassis Document Upload, Driver Document Upload, Truck B 9984 SYM, Truck BG 8339 AE

### Community 174 - "Community 174"
Cohesion: 0.50
Nodes (4): basename(), classify(), getComponentFileName(), toUpper()

### Community 175 - "Community 175"
Cohesion: 0.50
Nodes (4): Wialon getMessages, Wialon getZonesStat, Wialon API, Wialon messages/load_interval

### Community 176 - "Community 176"
Cohesion: 0.50
Nodes (4): False Finish Geofence Bug, Geofence Finish Guard, Loose Finish Geofence Option, Sequential Geofence Repeated Zones

### Community 177 - "Community 177"
Cohesion: 0.50
Nodes (3): checkboxOne, checkboxThree, checkboxTwo

### Community 178 - "Community 178"
Cohesion: 0.50
Nodes (3): disabledDescription, errorDescription, normalDescription

### Community 179 - "Community 179"
Cohesion: 0.67
Nodes (4): fetchStatistics(), getDefaultCategories(), normalizeSeries(), resetSeries()

### Community 181 - "Community 181"
Cohesion: 0.67
Nodes (3): BBS (Behavior-Based Safety), BBS Module Context, Patcher Role

### Community 182 - "Community 182"
Cohesion: 0.67
Nodes (3): dbmate Migration Workflow, Data Models, Soft Deactivation Pattern

### Community 183 - "Community 183"
Cohesion: 0.67
Nodes (3): GPS Trail Documentation, GPS Trail Phase 2a — Polygon Layers, GPS Trail Phase 2b — Scrubber

### Community 187 - "Community 187"
Cohesion: 0.67
Nodes (3): handleYearFilterChange(), loadData(), resetFilter()

### Community 188 - "Community 188"
Cohesion: 0.67
Nodes (3): getDefaultDateRange(), resetFilter(), toDateInputValue()

### Community 189 - "Community 189"
Cohesion: 0.67
Nodes (3): parseDateTimeValue(), resolveCheckInStopLabel(), validateCheckIn()

### Community 190 - "Community 190"
Cohesion: 0.67
Nodes (3): getChecked(), togglePagedSelection(), toggleSalesCostSelection()

## Knowledge Gaps
- **1988 isolated node(s):** `type`, `name`, `private`, `type`, `dev` (+1983 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toggle()` connect `Community 122` to `Community 56`, `Community 17`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `useSidebar()` connect `Community 122` to `VitePress Async Utils`, `Community 17`, `Community 56`, `Community 21`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `API_BASE` connect `API Config & Address Book` to `Sales Cost / SPK Module`, `Geofence & List Query Composables`, `BBS Safety Module`, `Community 137`, `Toast & UI Components`, `Sales Cost Form Components`, `Community 18`, `Community 147`, `Community 25`, `Community 30`, `Community 32`, `Community 33`, `Community 34`, `Community 36`, `Community 38`, `Community 39`, `Community 40`, `Community 45`, `Community 47`, `Community 48`, `Community 49`, `Community 51`, `Community 52`, `Community 53`, `Community 55`, `Community 59`, `Community 60`, `Community 62`, `Community 64`, `Community 71`, `Community 76`, `Community 82`, `Community 84`, `Community 86`, `Community 97`, `Community 102`, `Community 110`, `Community 111`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `type`, `name`, `private` to the rest of the system?**
  _1988 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Wialon GPS & Tracking Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05058717253839205 - nodes in this community are weakly interconnected._
- **Should `Vue 3 Core Reactivity (VitePress)` be split into smaller, more focused modules?**
  _Cohesion score 0.045764362220058426 - nodes in this community are weakly interconnected._
- **Should `Sales Cost / SPK Module` be split into smaller, more focused modules?**
  _Cohesion score 0.02531645569620253 - nodes in this community are weakly interconnected._