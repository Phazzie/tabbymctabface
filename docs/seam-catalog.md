# Runtime seam catalog

This is the current architecture map for the 1.0.0 extension. Historical phase
plans and generated mock inventories were removed because they described APIs
that no longer exist.

| Seam | Boundary | Typed contract | Release evidence |
| --- | --- | --- | --- |
| UI-01 | Popup DOM → popup controller | `PopupDependencies`, `RuntimeRequest` | popup unit tests, Playwright |
| MSG-01 | Popup → MV3 service worker | `RuntimeRequest`, `RuntimeResponse` | background/unit tests, Playwright |
| BOOT-01 | Chrome event → cold initialization | `InitializationResult` | bootstrap/background tests, worker-restart E2E |
| TAB-01 | Core → Chrome tabs/groups | `IChromeTabsAPI` | wrapper tests, integration tests |
| TAB-02 | Tab mutation transaction → compensation | `ITabManager` Results | rollback/concurrency tests |
| HUMOR-01 | Browser event/action → humor orchestration | `IHumorSystem` | runtime/integration tests |
| EGG-01 | Browser context → easter-egg selection | `IEasterEggFramework` | condition and full-catalog reachability tests |
| DATA-01 | Packaged JSON → validated cache | `IQuipStorage` | data and storage tests |
| NOTICE-01 | Humor system → Chrome notifications | `IChromeNotificationsAPI` | wrapper/integration tests |
| STATS-01 | Core → local usage counters | `IUsageStatsStore` | persistence/concurrency tests |
| REL-01 | Source/static assets → `dist/` | release-artifact validator | build and smoke tests |
| REL-02 | Validated `dist/` → ZIP/checksum | release-artifact validator | byte-parity and timezone tests |

Expected failures cross runtime seams as clone-safe discriminated Results. Thrown
browser errors are caught and mapped at Chrome/API boundaries. The popup runtime
API is intentionally narrow: group creation, confirmed random close, current-tab
listing, minimal statistics, and allow-listed browser events.

Any new runtime action, permission, custom easter-egg predicate, or external
capability needs a contract change plus a negative boundary test before release.
