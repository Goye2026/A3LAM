import type { Locale } from "./config";

export type FoundationMessages = {
  brandEyebrow: string;
  brandName: string;
  siteEyebrow: string;
  siteName: string;
  phaseStatus: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  primaryAction: string;
  secondaryAction: string;
  scopeKicker: string;
  scopeTitle: string;
  scopeDescription: string;
  samplesEyebrow: string;
  samplesTitle: string;
  sampleArabicLabel: string;
  sampleArabicValue: string;
  sampleMixedLabel: string;
  sampleMixedValue: string;
  sampleNumbersLabel: string;
  sampleNumbersValue: string;
  tokensEyebrow: string;
  tokensTitle: string;
  tokenInk: string;
  tokenBrand: string;
  tokenAccent: string;
  footerRtl: string;
  footerNote: string;
  navHome: string;
  navPeople: string;
  navCategories: string;
  navAbout: string;
  navSearch: string;
  navCreateProfile: string;
  navMyProfile: string;
  navLogout: string;
  navLogin: string;
  navSigningOut: string;
  homeAudience: string;
  homeCreateProfile: string;
  homeExplore: string;
  editorUnsaved: string;
  editorSaved: string;
  editorSaving: string;
  editorSaveHint: string;
  editorReadinessTitle: string;
  editorReady: string;
  editorIncomplete: string;
  editorMissing: string;
  editorReadinessAdvisory: string;
  moderationSearchPlaceholder: string;
  moderationAllCategories: string;
  moderationSortLabel: string;
  moderationSortUpdated: string;
  moderationSortCompletion: string;
  moderationSortName: string;
  moderationShowing: string;
  moderationNoMatch: string;
  profileShare: string;
  profileCopyLink: string;
  profilePrint: string;
  profileCopied: string;
  profileShareFailed: string;
  profileContact: string;
  profileContactHint: string;
  visibilityPublic: string;
  visibilityPublicHint: string;
  visibilityUnlisted: string;
  visibilityUnlistedHint: string;
  visibilityPrivate: string;
  visibilityPrivateHint: string;
  moderationAllVisibility: string;
  moderationAllCountries: string;
  moderationAllCities: string;
  moderationSortOldest: string;
  accountWelcomeTitle: string;
  accountWelcomeDescription: string;
  menuLabel: string;
  closeMenu: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchAction: string;
  retryAction: string;
  searchHint: string;
  searchResults: string;
  searchEmpty: string;
  searchLoading: string;
  searchError: string;
  searchFilterLabel: string;
  searchAllCategories: string;
  searchPageTitle: string;
  searchPageDescription: string;
  searchPageBack: string;
  searchNoResultsHint: string;
  searchEmptyQuery: string;
  clearSearch: string;
  closeSearch: string;
  searchCity: string;
  searchCityPlaceholder: string;
  searchCountry: string;
  searchCountryPlaceholder: string;
  searchProfessional: string;
  searchEditorial: string;
  searchLocationLabel: string;
  searchSkillsLabel: string;
  heroCta: string;
  heroSecondary: string;
  statsPeople: string;
  statsPublishedPeople: string;
  statsCategories: string;
  statsCountries: string;
  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescription: string;
  featuredEmpty: string;
  dataUnavailable: string;
  viewAll: string;
  profileStatus: string;
  profileStatusNote: string;
  publishedProfileStatus: string;
  samplePersonOneName: string;
  samplePersonOneRole: string;
  samplePersonOneMeta: string;
  samplePersonTwoName: string;
  samplePersonTwoRole: string;
  samplePersonTwoMeta: string;
  samplePersonThreeName: string;
  samplePersonThreeRole: string;
  samplePersonThreeMeta: string;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesDescription: string;
  categoriesPageTitle: string;
  categoriesPageDescription: string;
  categoryPeopleTitle: string;
  categoryResults: string;
  categoryNoPeople: string;
  categoryMedia: string;
  categoryAcademia: string;
  categoryCulture: string;
  categoryBusiness: string;
  categorySociety: string;
  categorySports: string;
  categoryScience: string;
  categoryCountSuffix: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaAction: string;
  trustEyebrow: string;
  trustSourcesTitle: string;
  trustSourcesDescription: string;
  trustArabicTitle: string;
  trustArabicDescription: string;
  trustGrowthTitle: string;
  trustGrowthDescription: string;
  discoveryEyebrow: string;
  discoveryTitle: string;
  discoveryDescription: string;
  discoveryDeferredLabel: string;
  discoveryDeferred: string;
  discoverySearchAction: string;
  discoveryCategoriesAction: string;
  footerTagline: string;
  footerExplore: string;
  footerContribute: string;
  footerAbout: string;
  footerContact: string;
  footerPrivacy: string;
  footerRights: string;
  demoLabel: string;
  demoDataNote: string;
  publishedDataNote: string;
  profileView: string;
  profileOverview: string;
  profileFacts: string;
  profileOccupation: string;
  profileBirth: string;
  profileDeath: string;
  profileCategories: string;
  profileRecordId: string;
  profileLastUpdated: string;
  profileNoBiography: string;
  profileNoTimeline: string;
  profileNoEducation: string;
  profileNoSources: string;
  profileRelatedCategories: string;
  profileRelatedPeople: string;
  profileSourceAccess: string;
  personPageTitle: string;
  personPageLede: string;
  backToDirectory: string;
  timelineLabel: string;
  educationLabel: string;
  sourcesLabel: string;
  sourceOfficial: string;
  sourceInstitution: string;
  sourceGovernment: string;
  sourceMedia: string;
  sourceProfessional: string;
  sourceAcademic: string;
  sourceSecondary: string;
  notPublished: string;
  notFoundEyebrow: string;
  notFoundTitle: string;
  notFoundDescription: string;
  notFoundAction: string;
  aboutTitle: string;
  aboutDescription: string;
  contactTitle: string;
  contactDescription: string;
  privacyTitle: string;
  privacyDescription: string;
  infoPageNextEyebrow: string;
  infoPageNextTitle: string;
  infoPageNextDescription: string;
  infoPageNextAction: string;
  adminTitle: string;
  adminSubtitle: string;
  adminLoginTitle: string;
  adminLoginDescription: string;
  adminAccessToken: string;
  adminLoginAction: string;
  adminLogout: string;
  adminAccessUnavailable: string;
  adminInvalidAccess: string;
  adminDashboard: string;
  adminPeople: string;
  adminAddPerson: string;
  adminReviewContent: string;
  adminPublished: string;
  adminDraft: string;
  adminReview: string;
  adminArchived: string;
  adminRecentUpdates: string;
  adminNoPeople: string;
  adminNoRecent: string;
  adminPeopleCount: string;
  adminSearch: string;
  adminFilterStatus: string;
  adminAllStatuses: string;
  adminAllCategories: string;
  adminSort: string;
  adminSortNewest: string;
  adminSortOldest: string;
  adminSortName: string;
  adminFilterAction: string;
  adminEdit: string;
  adminPreview: string;
  adminSaveDraft: string;
  adminSendReview: string;
  adminPublish: string;
  adminArchive: string;
  adminRestore: string;
  adminPersonNew: string;
  adminPersonEdit: string;
  adminBasicInformation: string;
  adminArabicName: string;
  adminEnglishName: string;
  adminSlug: string;
  adminShortBio: string;
  adminBiography: string;
  adminBirthDate: string;
  adminDeathDate: string;
  adminBirthPlace: string;
  adminDeathPlace: string;
  adminImageUrl: string;
  adminImageUrlHint: string;
  adminOccupations: string;
  adminOccupationsHint: string;
  adminCategories: string;
  adminCategoryCreateTitle: string;
  adminCategoryEditTitle: string;
  adminCategoryName: string;
  adminCategoryDescription: string;
  adminCategoryPublicNote: string;
  adminCreateCategory: string;
  adminUpdateCategory: string;
  adminCategorySaved: string;
  adminNoCategories: string;
  adminManageCategories: string;
  adminNotFound: string;
  adminSources: string;
  adminAddSource: string;
  adminSourceTitle: string;
  adminPublisher: string;
  adminSourceUrl: string;
  adminPublicationDate: string;
  adminAccessedAt: string;
  adminSourceType: string;
  adminReliability: string;
  adminReliabilityHigh: string;
  adminReliabilityMedium: string;
  adminReliabilityLow: string;
  adminTimeline: string;
  adminAddEvent: string;
  adminEventDate: string;
  adminEventTitle: string;
  adminEventDescription: string;
  adminEducation: string;
  adminAddEducation: string;
  adminInstitution: string;
  adminField: string;
  adminDateRange: string;
  adminDescription: string;
  adminRemove: string;
  adminSave: string;
  adminSaving: string;
  adminSaved: string;
  adminCancel: string;
  adminPreviewTitle: string;
  adminPreviewDescription: string;
  adminBackToEdit: string;
  adminDatabaseError: string;
  adminValidationError: string;
  adminReadinessTitle: string;
  adminReadinessReady: string;
  adminReadinessIncomplete: string;
  adminReadinessBlockedLabel: string;
  adminReadinessPublishHint: string;
  adminReadinessBlocked: string;
  adminUnauthorized: string;
  adminStatusLabel: string;
  adminStatusTransitionError: string;
  adminConflictError: string;
  adminSelectPlaceholder: string;
  adminNoSources: string;
  adminNoTimeline: string;
  adminNoEducation: string;
  adminPagePrevious: string;
  adminPageNext: string;
  adminUpdated: string;
  adminCreated: string;
  adminCredentialBoundary: string;
  adminCredentialLifecycleDeferred: string;
  adminOpaqueSessionId: string;
  adminControlCenter: string;
  adminControlCenterDescription: string;
  adminLaunchControl: string;
  adminLaunchControlDescription: string;
  adminLaunchReadOnly: string;
  adminLaunchStatus: string;
  adminLaunchDomainLabel: string;
  adminLaunchMode: string;
  adminLaunchDomainCountSuffix: string;
  adminLaunchEvidence: string;
  adminLaunchOwner: string;
  adminLaunchModeAutomatic: string;
  adminLaunchModeManual: string;
  adminLaunchModeExternal: string;
  adminLaunchReady: string;
  adminLaunchReadyWithLimitations: string;
  adminLaunchRequiresConfiguration: string;
  adminLaunchNotTested: string;
  adminLaunchBlocked: string;
  adminLaunchNotApplicable: string;
  adminLaunchApplication: string;
  adminLaunchDatabase: string;
  adminLaunchMigrations: string;
  adminLaunchAuthentication: string;
  adminLaunchRbac: string;
  adminLaunchEditorial: string;
  adminLaunchMedia: string;
  adminLaunchSeo: string;
  adminLaunchSiteExperience: string;
  adminLaunchOperations: string;
  adminLaunchPortability: string;
  adminLaunchAndroid: string;
  adminLaunchDomain: string;
  adminLaunchPeopleReadiness: string;
  adminLaunchRequiredFields: string;
  adminLaunchRecommendedFields: string;
  adminLaunchSources: string;
  adminLaunchPortrait: string;
  adminLaunchOpen: string;
  adminLaunchChecklist: string;
  adminLaunchNoData: string;
  adminLaunchLoading: string;
  adminLaunchError: string;
  adminLaunchNoMutation: string;
  adminLaunchEvidenceApplication: string;
  adminLaunchEvidenceDeployment: string;
  adminLaunchEvidenceProtected: string;
  adminLaunchEvidenceMigration: string;
  adminLaunchEvidenceMigrationAction: string;
  adminLaunchEvidenceAuthentication: string;
  adminLaunchEvidenceRbac: string;
  adminLaunchEvidenceEditorial: string;
  adminLaunchEvidenceMedia: string;
  adminLaunchEvidenceSeo: string;
  adminLaunchEvidenceSiteExperience: string;
  adminLaunchEvidenceOperations: string;
  adminLaunchEvidencePortability: string;
  adminLaunchEvidenceAndroid: string;
  adminLaunchEvidenceDomain: string;
  adminLaunchNextStep: string;
  adminLaunchBackup: string;
  adminLaunchRestore: string;
  adminLaunchMonitoring: string;
  adminLaunchEmail: string;
  adminLaunchDocker: string;
  adminLaunchCustomDomain: string;
  adminLaunchBuild: string;
  adminLaunchHealth: string;
  adminLaunchPublicRoutes: string;
  adminPeopleGroup: string;
  adminOperationsGroup: string;
  adminProductGroup: string;
  adminSystemGroup: string;
  adminUsers: string;
  adminProfiles: string;
  adminAdministrators: string;
  adminEditors: string;
  adminContent: string;
  adminHomepage: string;
  adminAppearance: string;
  adminMedia: string;
  adminSeo: string;
  adminAudit: string;
  adminSystem: string;
  adminSettings: string;
  adminSiteExperienceDescription: string;
  adminSiteExperienceCenter: string;
  adminSiteExperienceCenterDescription: string;
  adminPublishDraft: string;
  adminDraftVersion: string;
  adminPublishedVersion: string;
  adminLastSaved: string;
  adminIdentitySettings: string;
  adminThemeSettings: string;
  adminHomepageBuilder: string;
  adminNavigationManager: string;
  adminFooterManager: string;
  adminSeoManager: string;
  adminProfilePresentationSettings: string;
  adminSystemHealth: string;
  adminRecentActivity: string;
  adminModerationQueue: string;
  adminQuickActions: string;
  adminMediaProvider: string;
  adminRequiresConfiguration: string;
  adminVisible: string;
  adminHidden: string;
  adminLabel: string;
  adminUrl: string;
  adminExternalLink: string;
  adminSectionTitle: string;
  adminSectionDescription: string;
  adminPublishConfirmation: string;
  adminPublishSuccess: string;
  adminDraftSaved: string;
  adminMoveUp: string;
  adminMoveDown: string;
  adminSiteName: string;
  adminTagline: string;
  adminDefaultLanguage: string;
  adminDirection: string;
  adminSupportEmail: string;
  adminContactEmail: string;
  adminLogo: string;
  adminFavicon: string;
  adminShortName: string;
  adminBrandDescription: string;
  adminTheme: string;
  adminTypography: string;
  adminSpacing: string;
  adminRadius: string;
  adminNavigationStyle: string;
  adminCardStyle: string;
  adminButtonStyle: string;
  adminHeroStyle: string;
  adminFooterStyle: string;
  adminHero: string;
  adminSearchSection: string;
  adminFeaturedSection: string;
  adminProfilesSection: string;
  adminCategoriesSection: string;
  adminAboutSection: string;
  adminFinalCta: string;
  adminSelectionMode: string;
  adminItemLimit: string;
  adminDisplayMode: string;
  adminHelperText: string;
  adminSeoTitle: string;
  adminDefaultDescription: string;
  adminKeywords: string;
  adminOgImage: string;
  adminTwitterCard: string;
  adminCanonicalBase: string;
  adminIndexingAllowed: string;
  adminTemplate: string;
  adminSectionOrder: string;
  adminShowPortfolio: string;
  adminShowContact: string;
  adminShowSocial: string;
  adminShowPrint: string;
  adminShowShare: string;
  adminPrimary: string;
  adminSecondary: string;
  adminCopyright: string;
  adminLegalLinks: string;
  adminTokenPrimary: string;
  adminTokenAccent: string;
  adminTokenSurface: string;
  adminTokenDensity: string;
  adminTokenContainer: string;
  adminAddLink: string;
  adminAddGroup: string;
  adminAddSocialLink: string;
  adminMediaSafetyNote: string;
  adminMediaLibrary: string;
  adminMediaUpload: string;
  adminMediaSelect: string;
  adminMediaCurrentPortrait: string;
  adminMediaAltText: string;
  adminMediaSource: string;
  adminMediaAttribution: string;
  adminMediaLicense: string;
  adminMediaVisibility: string;
  adminMediaPublic: string;
  adminMediaPrivate: string;
  adminMediaSaveMetadata: string;
  adminMediaDetach: string;
  adminMediaArchive: string;
  adminMediaNoAssets: string;
  adminMediaNoProvider: string;
  adminMediaRequiresPersonId: string;
  adminMediaPendingMigration: string;
  adminUnavailableTitle: string;
  adminUnavailableDescription: string;
  adminRequiresSchema: string;
  adminRequiresMigration: string;
  adminReadOnly: string;
  adminDatabaseStatus: string;
  adminAuthStatus: string;
  adminMigrationStatus: string;
  adminSiteExperienceStatus: string;
  adminAppliedMigrations: string;
  adminPendingMigrations: string;
  adminExpectedMigrations: string;
  adminMigrationRegistryTitle: string;
  adminMigrationRegistryDescription: string;
  adminMigrationVersion: string;
  adminMigrationRowStatus: string;
  adminMigrationAppliedAt: string;
  adminMigrationApplied: string;
  adminMigrationPending: string;
  adminMigrationUnexpected: string;
  adminMigrationInconsistent: string;
  adminMigrationUnavailable: string;
  adminMigrationRegistryHealthy: string;
  adminMigrationRegistryPending: string;
  adminMigrationRegistryInconsistent: string;
  adminMigrationRegistryUnavailable: string;
  adminMigrationNoAppliedAt: string;
  adminMigrationControlTitle: string;
  adminMigrationControlDescription: string;
  adminMigrationPreflight: string;
  adminMigrationPrerequisites: string;
  adminMigrationNext: string;
  adminMigrationAuthorization: string;
  adminMigrationExecution: string;
  adminMigrationDatabase: string;
  adminMigrationRegistry: string;
  adminMigrationAuthorized: string;
  adminMigrationNotAuthorized: string;
  adminMigrationReady: string;
  adminMigrationBlocked: string;
  adminMigrationPrerequisiteMissing: string;
  adminMigrationNoPending: string;
  adminMigrationExecuteButton: string;
  adminMigrationConfirmPrompt: string;
  adminMigrationSuccess: string;
  adminMigrationFailure: string;
  adminMigrationStopped: string;
  adminPublishedResources: string;
  adminDraftResources: string;
  adminAvailable: string;
  adminUnavailable: string;
  adminNoUsers: string;
  adminPeopleRelated: string;
  adminProfilesRelated: string;
  adminIdentityStatus: string;
  adminStatusInvited: string;
  adminStatusActive: string;
  adminStatusDisabled: string;
  adminRole: string;
  adminRoleSuperAdmin: string;
  adminRoleAdmin: string;
  adminRoleEditor: string;
  adminRoleModerator: string;
  adminCreateIdentity: string;
  adminIdentityName: string;
  adminIdentityEmail: string;
  adminIdentityRequiresActivation: string;
  adminChangeRole: string;
  adminDisable: string;
  adminEnable: string;
  adminSessions: string;
  adminRevoke: string;
  adminNoSessions: string;
  adminSessionExpires: string;
  adminSessionDevice: string;
  adminSessionAddress: string;
  adminRevokeUserSessions: string;
  adminUserStatus: string;
  adminUserActive: string;
  adminUserDisabled: string;
  adminNoAdminIdentities: string;
  adminNoEditors: string;
  adminPermissionMatrix: string;
  adminPermissionMatrixDescription: string;
  adminPermissionRole: string;
  adminPermissionCode: string;
  adminUserDetail: string;
  adminAccountOverview: string;
  adminProfileOverview: string;
  adminSecurity: string;
  adminCompletion: string;
  adminActiveSessions: string;
  adminAuditEvents: string;
  adminView: string;
  adminRevokeAllSessions: string;
  adminSuspendUser: string;
  adminReactivateUser: string;
  adminPermissionOverrides: string;
  adminDefaultPermissions: string;
  adminEffectivePermissions: string;
  adminPermissionAllow: string;
  adminPermissionDeny: string;
  adminSavePermissions: string;
  adminPermissionSaved: string;
  adminPermissionConfiguration: string;
  adminConfirmationNeeded: string;
  adminAuditFilters: string;
  adminAuditActor: string;
  adminAuditAction: string;
  adminAuditEntity: string;
  adminAuditFrom: string;
  adminAuditTo: string;
  adminClearFilters: string;
  adminNoAudit: string;
  adminSessionStatus: string;
  adminCurrentSession: string;
  adminSessionActive: string;
  adminSessionRevoked: string;
  adminSessionExpired: string;
  adminAllSessions: string;
  adminProfileStatus: string;
  adminVisibility: string;
  adminVisibilityPrivate: string;
  adminVisibilityUnlisted: string;
  adminVisibilityPublished: string;
  adminHasProfile: string;
  adminWithProfile: string;
  adminWithoutProfile: string;
  adminCompletionShort: string;
  adminAi: string;
  adminAiActivation: string;
  adminAiActivationDisabled: string;
  adminAiActivationEnabled: string;
  adminAiDescription: string;
  adminAiProvider: string;
  adminAiDocumentProcessing: string;
  adminAiPrivacyNotice: string;
  adminAiCreateFromDocument: string;
  adminAiConfigurationRequired: string;
  adminAiDocuments: string;
  adminAiProcessing: string;
  adminAiCompleted: string;
  adminAiFailed: string;
  adminAiReviewRequired: string;
  adminAiNoDocuments: string;
  adminAiUploadHint: string;
  adminAiSupportedTypes: string;
  adminAiHumanReview: string;
  adminAiDraftBoundary: string;
  adminAiNoInference: string;
  adminAiNoPersistence: string;
  adminAiRequiresMigration: string;
  adminAiQueue: string;
  adminAiMalwareScanning: string;
  adminAiRetention: string;
  adminAiDocumentStatus: string;
  adminAiNoDocumentSelected: string;
  adminAiReviewStart: string;
  adminAiReviewUnavailable: string;
  adminAiExtractedText: string;
  adminAiNoExtractedText: string;
  adminAiRetry: string;
  adminAiUploadProgress: string;
  adminAiUnsupportedType: string;
  adminAiInvalidSize: string;
  adminAiRemoveSelection: string;
  adminAiStructuredFields: string;
  adminAiExtractionCapability: string;
  adminAiParserStatus: string;
  adminAiLimits: string;
  adminAiParserAvailable: string;
  adminAiParserUnavailable: string;
  adminAiReviewField: string;
  adminAiReviewValue: string;
  adminAiReviewSource: string;
  adminAiReviewConfidence: string;
  adminAiReviewClassification: string;
  adminAiReviewAction: string;
  adminAiAccept: string;
  adminAiEdit: string;
  adminAiReject: string;
  adminAiReviewSaving: string;
  adminAiReviewError: string;
  adminAiReviewNote: string;
  adminAiNoFacts: string;
  adminAiGeneration: string;
  adminAiGenerationProvider: string;
  adminAiGenerationModes: string;
  adminAiOutputLanguages: string;
  adminAiGenerationDisabled: string;
  adminAiGenerationDraft: string;
  adminAiGenerationQuality: string;
  adminAiGenerationClaims: string;
  adminAiGenerationNoClaims: string;
  adminAiGenerationReview: string;
  adminAiRequestSource: string;
  adminAiConflict: string;
  adminAiPipeline: string;
  adminAiPipelineUploaded: string;
  adminAiPipelineExtracted: string;
  adminAiPipelineFacts: string;
  adminAiPipelineGeneration: string;
  adminAiPipelineReview: string;
  adminAiPipelineApproved: string;
  adminAiGenerationStatus: string;
  adminAiQualityGate: string;
  adminAiBack: string;
  adminAiLocalOnly: string;
  adminAiChooseLocalFile: string;
  adminAiOcrNotice: string;
  adminAiDocxNotice: string;
  adminAiSourceA: string;
  adminAiSourceB: string;
  adminAiBoundaryDraftPerson: string;
  adminAiBoundaryDraftProfile: string;
  adminAiBoundaryDraftPublished: string;
  adminAiDraftStatus: string;
  adminAiLanguageArabic: string;
  adminAiLanguageEnglish: string;
  adminAiLanguageBilingual: string;
  adminAiLanguageSource: string;
  adminAiModeProfessionalCvDescription: string;
  adminAiModeProfessionalProfileDescription: string;
  adminAiModePersonDraftDescription: string;
  adminAiModeBiographyDescription: string;
  adminAiModeSeoDescription: string;
  adminAiEditedSuffix: string;
  adminAiWorkspaceTitle: string;
  adminAiWorkspaceDescription: string;
  adminAiStepDocument: string;
  adminAiStepExtraction: string;
  adminAiStepFacts: string;
  adminAiStepGeneration: string;
  adminAiStepDraft: string;
  adminAiStepClaims: string;
  adminAiStepReview: string;
  adminAiRunIsolatedDemo: string;
  adminAiLocalDemoNotice: string;
  adminAiDropzoneHint: string;
  adminAiSelectedDocument: string;
  adminAiDetectedLanguage: string;
  adminAiProcessingState: string;
  adminAiSections: string;
  adminAiParagraphs: string;
  adminAiOpenSource: string;
  adminAiEvidenceUnavailable: string;
  adminAiConflictDetected: string;
  adminAiNeedsHumanReview: string;
  adminAiGenerationChooseMode: string;
  adminAiGenerationChooseLanguage: string;
  adminAiModeProfessionalCv: string;
  adminAiModeProfessionalProfile: string;
  adminAiModePersonDraft: string;
  adminAiModeBiography: string;
  adminAiModeSeo: string;
  adminAiReadiness: string;
  adminAiReadinessDescription: string;
  adminAiReadinessStatus: string;
  adminAiReadinessReason: string;
  adminAiReadinessEvidence: string;
  adminAiReadinessNextStep: string;
  adminAiReadinessOwner: string;
  adminAiReadinessVerificationMethod: string;
  adminAiReadinessLayer: string;
  adminAiReadinessRisk: string;
  adminAiDecisionNotTested: string;
  adminAiReadinessBlocker: string;
  adminAiReadinessNoBlocker: string;
  adminAiReadinessInfrastructure: string;
  adminAiReadinessApplication: string;
  adminAiReadinessSecurity: string;
  adminAiReadinessOperations: string;
  adminAiReadinessMigration: string;
  adminAiReadinessGate: string;
  adminAiGateUpload: string;
  adminAiGateProcessing: string;
  adminAiGateGeneration: string;
  adminAiGateOcr: string;
  adminAiGatePublication: string;
  adminAiGateOff: string;
  adminAiDecisionActivationReady: string;
  adminAiDecisionActivationReadyWithLimitations: string;
  adminAiDecisionNotReady: string;
  adminAiDecisionBlocked: string;
  adminAiReadinessAuthentication: string;
  adminAiReadinessCsrf: string;
  adminAiReadinessDocumentIngestion: string;
  adminAiReadinessClaimsProvenance: string;
  adminAiReadinessWorkflowStateMachine: string;
  adminAiReadinessExternalQa: string;
  adminAiReadinessAiProvider: string;
  adminAiReadinessPrivateStorage: string;
  adminAiReadinessMalwareScanner: string;
  adminAiReadinessQueue: string;
  adminAiReadinessWorker: string;
  adminAiReadinessOcr: string;
  adminAiReadinessPersistence: string;
  adminAiReadinessExtraction: string;
  adminAiReadinessMigrations: string;
  adminAiReadinessRetention: string;
  adminAiReadinessRateLimits: string;
  adminAiReadinessCostControls: string;
  adminAiReadinessObservability: string;
  adminAiReadinessAudit: string;
  adminAiReadinessRbac: string;
  adminAiReadinessPrivacy: string;
  adminAiReadinessPromptBoundary: string;
  adminAiReadinessGeneration: string;
  adminAiReadinessHumanReview: string;
  adminAiReadinessPublication: string;
  adminAiReadinessPublicationGuard: string;
  adminAiReadinessRollback: string;
  adminAiRunGeneration: string;
  adminAiSourceBacked: string;
  adminAiNeedsVerification: string;
  adminAiAiWording: string;
  adminAiFinalPrivateDraft: string;
  adminAiPrivateDraftNotice: string;
  adminAiSourceFact: string;
  adminAiGeneratedClaim: string;
  adminAiClaimAccept: string;
  adminAiClaimEdit: string;
  adminAiClaimReject: string;
  adminAiClaimRequestSource: string;
  adminAiEditorialReadiness: string;
  adminAiIdentityCheck: string;
  adminAiSourcesCheck: string;
  adminAiEvidenceCheck: string;
  adminAiConflictsCheck: string;
  adminAiClaimsCheck: string;
  adminAiCompletenessCheck: string;
  adminAiPrivacyCheck: string;
  adminAiPublicationCheck: string;
  adminAiPass: string;
  adminAiWarning: string;
  adminAiBlocked: string;
  adminAiProductionDisabled: string;
  adminAiMockAvailable: string;
  adminAiReviewRequiredBeforeProceed: string;
  adminAiNoLocalDraft: string;
  adminAiDemoGenerated: string;
  adminAiWorkflowIntro: string;
  adminAiSandboxLabel: string;
  adminAiProgress: string;
  adminAiStepOf: string;
  adminAiNextAction: string;
  adminAiModeSelected: string;
  adminAiLocalFileSelected: string;
  adminAiOriginalValue: string;
  adminAiReviewedValue: string;
  adminAiDecision: string;
  adminAiSaveDraft: string;
  adminAiContinueReview: string;
  adminAiFinalBoundary: string;
  adminAiSourceCoverage: string;
  adminAiUnresolved: string;
  adminAiRejected: string;
  adminAiEdited: string;
  adminAiReviewer: string;
  adminAiUnsavedChanges: string;
  adminAiLocalStateAvailable: string;
  adminAiResumeLocal: string;
  adminAiDiscardLocal: string;
  adminAiSavedLocally: string;
  adminAiLocalSaveFailed: string;
};

const ar: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "أساس النظام",
  siteEyebrow: "موسوعة عربية · ملفات مهنية",
  siteName: "أعلام",
  phaseStatus: "منصة معرفية موثوقة",
  heroEyebrow: "اكتشف أثر الشخصيات العربية",
  heroTitle: "أعلام — موسوعة الشخصيات العربية والسير المهنية",
  heroLede:
    "اكتشف الشخصيات العربية، وابحث عن المهنيين، وأنشئ سيرتك الذاتية في مساحة واحدة. تُنشر الملفات المهنية بعد المراجعة وربط المعلومات بمصادر واضحة.",
  primaryAction: "استكشف الشخصيات",
  secondaryAction: "تصفح التصنيفات",
  scopeKicker: "مبدأ التحرير",
  scopeTitle: "الدقة قبل الكثرة",
  scopeDescription: "ملفات منظمة · مصادر واضحة · مراجعة بشرية",
  samplesEyebrow: "عينات الأساس",
  samplesTitle: "لغة بصرية قابلة للتوسع",
  sampleArabicLabel: "العربية RTL",
  sampleArabicValue: "مرحبًا بك في أساس أعلام",
  sampleMixedLabel: "Mixed Arabic/Latin",
  sampleMixedValue: "A3LAM — موسوعة معرفية",
  sampleNumbersLabel: "Numbers",
  sampleNumbersValue: "2026 · 01 · 22.13.0",
  tokensEyebrow: "Semantic tokens",
  tokensTitle: "لغة بصرية قابلة للتوسع",
  tokenInk: "Ink / النص الأساسي",
  tokenBrand: "Brand / اللون الأساسي",
  tokenAccent: "Accent / التمييز",
  footerRtl: "تجربة عربية من اليمين إلى اليسار",
  footerNote: "© أعلام · موسوعة الشخصيات العربية",
  navHome: "الرئيسية",
  navPeople: "استكشف",
  navCategories: "التصنيفات",
  navAbout: "عن أعلام",
  navSearch: "البحث",
  navCreateProfile: "أنشئ سيرتك الذاتية",
  navMyProfile: "سيرتي المهنية",
  navLogout: "تسجيل الخروج",
  navLogin: "تسجيل الدخول",
  navSigningOut: "جارٍ تسجيل الخروج…",
  homeAudience: "موسوعة عربية + منصة سير ذاتية مهنية",
  homeCreateProfile: "أنشئ سيرتك الذاتية",
  homeExplore: "استكشف الأعلام",
  editorUnsaved: "لديك تغييرات غير محفوظة",
  editorSaved: "تم حفظ المسودة",
  editorSaving: "جارٍ حفظ المسودة…",
  editorSaveHint: "احفظ المسودة قبل مغادرة الصفحة حتى لا تفقد عملك.",
  editorReadinessTitle: "جاهزية الملف",
  editorReady: "جاهز للمراجعة",
  editorIncomplete: "يحتاج استكمالًا",
  editorMissing: "المتبقي",
  editorReadinessAdvisory: "نسبة الاكتمال إرشادية ولا تغيّر قواعد المراجعة أو النشر.",
  moderationSearchPlaceholder: "ابحث بالاسم أو المسمى أو المدينة…",
  moderationAllCategories: "كل التصنيفات",
  moderationSortLabel: "ترتيب النتائج",
  moderationSortUpdated: "الأحدث تعديلًا",
  moderationSortCompletion: "الأعلى اكتمالًا",
  moderationSortName: "الاسم أبجديًا",
  moderationShowing: "عرض",
  moderationNoMatch: "لا توجد ملفات تطابق أدوات التصفية الحالية.",
  profileShare: "مشاركة الملف",
  profileCopyLink: "نسخ الرابط",
  profilePrint: "طباعة الملف",
  profileCopied: "تم نسخ رابط الملف",
  profileShareFailed: "تعذرت المشاركة؛ يمكنك نسخ الرابط يدويًا.",
  profileContact: "تواصل مهنيًا",
  profileContactHint: "تُفتح وسيلة التواصل التي اختار صاحب الملف إتاحتها فقط.",
  visibilityPublic: "عام",
  visibilityPublicHint: "يمكن لأي شخص العثور على ملفك عبر البحث والتصنيفات.",
  visibilityUnlisted: "غير مدرج",
  visibilityUnlistedHint: "يمكن لمن يملك الرابط مشاهدة ملفك، لكنه لا يظهر في البحث.",
  visibilityPrivate: "خاص",
  visibilityPrivateHint: "ملفك غير متاح للعامة.",
  moderationAllVisibility: "كل أنماط الظهور",
  moderationAllCountries: "كل الدول",
  moderationAllCities: "كل المدن",
  moderationSortOldest: "الأقدم تعديلًا",
  accountWelcomeTitle: "مرحبًا بك في أعلام",
  accountWelcomeDescription: "الخطوة التالية واضحة: أنشئ ملفك المهني وشارك خبرتك مع الآخرين.",
  menuLabel: "فتح القائمة",
  closeMenu: "إغلاق القائمة",
  searchLabel: "ابحث في أعلام",
  searchPlaceholder: "ابحث عن اسم، مهنة، أو مدينة...",
  searchAction: "بحث",
  retryAction: "المحاولة مرة أخرى",
  searchHint: "جرّب اسمًا أو مجالًا لاكتشاف ملفات موثقة",
  searchResults: "نتائج البحث",
  searchEmpty: "لم نعثر على تطابق في السجلات المنشورة الحالية.",
  searchLoading: "جارٍ البحث في السجلات المنشورة...",
  searchError: "تعذر تنفيذ البحث الآن. حاول مرة أخرى.",
  searchFilterLabel: "التصنيف",
  searchAllCategories: "كل التصنيفات",
  searchPageTitle: "اكتشف في أعلام",
  searchPageDescription: "ابحث في السجلات المنشورة، ثم تابع إلى الملف المرتبط بمصادره.",
  searchPageBack: "العودة إلى الاستكشاف",
  searchNoResultsHint: "جرّب اسمًا أقصر، أو اختر مجالًا مختلفًا من التصنيفات.",
  searchEmptyQuery: "اكتب اسمًا أو اختر مرشحًا واحدًا على الأقل لبدء البحث.",
  clearSearch: "مسح البحث",
  closeSearch: "إغلاق البحث",
  searchCity: "المدينة",
  searchCityPlaceholder: "مثال: صنعاء",
  searchCountry: "الدولة",
  searchCountryPlaceholder: "مثال: اليمن",
  searchProfessional: "ملف مهني",
  searchEditorial: "سجل تحريري",
  searchLocationLabel: "الموقع",
  searchSkillsLabel: "المهارات",
  heroCta: "اكتشف الشخصيات",
  heroSecondary: "كيف نتحقق؟",
  statsPeople: "السجلات المنشورة",
  statsPublishedPeople: "السجلات المنشورة",
  statsCategories: "مجالات منشورة",
  statsCountries: "توسع عربي لاحق",
  featuredEyebrow: "ملفات مختارة",
  featuredTitle: "وجوهٌ تستحق أن تُعرف",
  featuredDescription: "تظهر هنا الملفات المنشورة بعد اجتياز التحقق التحريري وربط المعلومات بمصادرها.",
  featuredEmpty: "لا توجد ملفات منشورة في الكتالوج الحالي بعد.",
  dataUnavailable: "تعذر الوصول إلى الكتالوج المنشور الآن.",
  viewAll: "عرض الدليل",
  profileStatus: "نموذج عرض",
  profileStatusNote: "بيانات تجريبية لتوضيح الواجهة — ليست ملفًا منشورًا.",
  publishedProfileStatus: "ملف منشور",
  samplePersonOneName: "نموذج شخصية أولى",
  samplePersonOneRole: "الإعلام والصحافة",
  samplePersonOneMeta: "اليمن · ملف قيد المراجعة",
  samplePersonTwoName: "نموذج شخصية ثانية",
  samplePersonTwoRole: "الأكاديميا والبحث",
  samplePersonTwoMeta: "اليمن · ملف قيد المراجعة",
  samplePersonThreeName: "نموذج شخصية ثالثة",
  samplePersonThreeRole: "الثقافة والفنون",
  samplePersonThreeMeta: "اليمن · ملف قيد المراجعة",
  categoriesEyebrow: "اكتشف حسب المجال",
  categoriesTitle: "كل أثرٍ له سياقه",
  categoriesDescription: "تنقل بين المجالات لاكتشاف الأشخاص والأفكار والإنجازات ضمن سياقها المهني والثقافي.",
  categoriesPageTitle: "التصنيفات والمجالات",
  categoriesPageDescription: "مدخل منظم إلى مجالات المعرفة التي تنتمي إليها الملفات المنشورة في أعلام.",
  categoryPeopleTitle: "أشخاص هذا المجال",
  categoryResults: "ملفات منشورة",
  categoryNoPeople: "لا توجد ملفات منشورة في هذا المجال بعد.",
  categoryMedia: "الإعلام والصحافة",
  categoryAcademia: "الأكاديميا والبحث",
  categoryCulture: "الثقافة والفنون",
  categoryBusiness: "الأعمال والاقتصاد",
  categorySociety: "المجتمع والتأثير",
  categorySports: "الرياضة",
  categoryScience: "العلوم والتقنية",
  categoryCountSuffix: "مسارًا معرفيًا",
  ctaEyebrow: "ساهم في بناء المعرفة",
  ctaTitle: "لديك معلومة موثوقة؟ اجعلها تصل.",
  ctaDescription: "أعلام ينمو بالمصادر الدقيقة والتصحيحات المسؤولة. ستصبح أدوات المساهمة متاحة ضمن المراجعة التحريرية.",
  ctaAction: "اعرف المزيد",
  trustEyebrow: "لماذا أعلام",
  trustSourcesTitle: "معرفة موثقة",
  trustSourcesDescription: "نربط السجلات بمصادر واضحة ونترك المعلومة قابلة للتتبع.",
  trustArabicTitle: "تجربة عربية أولًا",
  trustArabicDescription: "واجهة هادئة مصممة لقراءة الأسماء والسير العربية بوضوح.",
  trustGrowthTitle: "موسوعة قابلة للنمو",
  trustGrowthDescription: "بنية منظمة تستوعب الشخصيات والحقول الجديدة دون فقدان السياق.",
  discoveryEyebrow: "مسار الاكتشاف",
  discoveryTitle: "رحلة عبر المعرفة العربية",
  discoveryDescription: "سنربط الأحداث والحقب والملفات المنشورة في تجربة زمنية أعمق عندما تتوفر البيانات المنظمة اللازمة.",
  discoveryDeferredLabel: "قيد الإعداد",
  discoveryDeferred: "العرض الزمني يحتاج بيانات حقب وأحداث منشورة؛ لذلك لا نعرض عناصر غير موثقة في الوقت الحالي.",
  discoverySearchAction: "ابدأ بالبحث",
  discoveryCategoriesAction: "استكشف المجالات",
  footerTagline: "منصة عربية لفهم أثر الأشخاص وصناعة المعرفة.",
  footerExplore: "استكشف",
  footerContribute: "ساهم",
  footerAbout: "المشروع",
  footerContact: "تواصل",
  footerPrivacy: "الخصوصية",
  footerRights: "جميع الحقوق محفوظة",
  demoLabel: "عرض تجريبي",
  demoDataNote: "لا تمثل هذه النماذج ملفات أشخاص منشورة.",
  publishedDataNote: "تُعرض هنا السجلات المنشورة فقط بعد التحقق وربط المصادر.",
  profileView: "عرض الملف",
  profileOverview: "نبذة عامة",
  profileFacts: "حقائق الملف",
  profileOccupation: "المهنة والمجال",
  profileBirth: "الميلاد",
  profileDeath: "الوفاة",
  profileCategories: "التصنيفات",
  profileRecordId: "معرّف داخلي",
  profileLastUpdated: "آخر تحديث",
  profileNoBiography: "لا تتوفر نبذة موسعة لهذا الملف بعد.",
  profileNoTimeline: "لا توجد أحداث زمنية منشورة لهذا الملف بعد.",
  profileNoEducation: "لا توجد بيانات تعليمية منشورة لهذا الملف بعد.",
  profileNoSources: "لا توجد مصادر منشورة لهذا الملف بعد.",
  profileRelatedCategories: "مجالات مرتبطة",
  profileRelatedPeople: "ملفات ذات صلة",
  profileSourceAccess: "فتح المصدر",
  personPageTitle: "صفحة نموذجية لملف شخصية",
  personPageLede: "هذه صفحة عرض محايدة توضّح بنية الملف العام قبل ربطها ببيانات منشورة ومصادر معتمدة.",
  backToDirectory: "العودة إلى الدليل",
  timelineLabel: "المسار الزمني",
  educationLabel: "التعليم والخبرة",
  sourcesLabel: "المصادر والتحقق",
  sourceOfficial: "رسمي",
  sourceInstitution: "مؤسسة",
  sourceGovernment: "حكومي",
  sourceMedia: "إعلامي",
  sourceProfessional: "مهني",
  sourceAcademic: "أكاديمي",
  sourceSecondary: "مصدر ثانوي",
  notPublished: "غير منشور بعد",
  notFoundEyebrow: "404 / أعلام",
  notFoundTitle: "هذه الصفحة غير موجودة",
  notFoundDescription: "لم نتمكن من العثور على الملف أو المسار المطلوب.",
  notFoundAction: "العودة إلى الرئيسية",
  aboutTitle: "عن أعلام",
  aboutDescription: "أعلام موسوعة عربية تُبنى حول ملفات منظمة، مصادر واضحة، ومراجعة بشرية قبل النشر.",
  contactTitle: "تواصل مع أعلام",
  contactDescription: "للاستفسارات التحريرية أو اقتراح مصدر، استخدم قنوات التواصل التي ستُعلن عند إطلاقها. هذه الصفحة لا تستقبل بيانات حساسة حاليًا.",
  privacyTitle: "الخصوصية",
  privacyDescription: "نحافظ على مبدأ تقليل البيانات، ولا نعرض معلومات شخصية حساسة أو وسائل اتصال خاصة. ستُوثّق سياسة الخصوصية التفصيلية قبل الإطلاق العام.",
  infoPageNextEyebrow: "الخطوة التالية",
  infoPageNextTitle: "ابدأ من الملفات المنشورة",
  infoPageNextDescription: "تصفح السجلات المتاحة أو انتقل بين المجالات لاكتشاف المعرفة المرتبطة بالمصادر.",
  infoPageNextAction: "استكشف الشخصيات",
  adminTitle: "التحرير الداخلي",
  adminSubtitle: "إدارة محتوى موسوعة أعلام",
  adminLoginTitle: "دخول مساحة التحرير",
  adminLoginDescription: "هذه المساحة مخصصة للمحررين المصرح لهم فقط.",
  adminAccessToken: "رمز الوصول التحريري",
  adminLoginAction: "دخول",
  adminLogout: "تسجيل الخروج",
  adminAccessUnavailable: "لم تُضبط حماية مساحة التحرير في هذه البيئة.",
  adminInvalidAccess: "رمز الوصول غير صحيح أو منتهي.",
  adminDashboard: "لوحة التحرير",
  adminPeople: "الشخصيات",
  adminAddPerson: "إضافة شخصية",
  adminReviewContent: "مراجعة المحتوى",
  adminPublished: "منشور",
  adminDraft: "مسودة",
  adminReview: "قيد المراجعة",
  adminArchived: "مؤرشف",
  adminRecentUpdates: "آخر التعديلات",
  adminNoPeople: "لا توجد شخصيات في السجل الحالي.",
  adminNoRecent: "لا توجد تعديلات حديثة.",
  adminPeopleCount: "إجمالي الشخصيات",
  adminSearch: "بحث داخلي",
  adminFilterStatus: "تصفية حسب الحالة",
  adminAllStatuses: "كل الحالات",
  adminAllCategories: "كل التصنيفات",
  adminSort: "الفرز",
  adminSortNewest: "الأحدث تحديثًا",
  adminSortOldest: "الأقدم تحديثًا",
  adminSortName: "الاسم الأبجدي",
  adminFilterAction: "تطبيق التصفية",
  adminEdit: "تحرير",
  adminPreview: "معاينة",
  adminSaveDraft: "حفظ كمسودة",
  adminSendReview: "إرسال للمراجعة",
  adminPublish: "نشر",
  adminArchive: "أرشفة",
  adminRestore: "إعادة إلى المراجعة",
  adminPersonNew: "إضافة شخصية جديدة",
  adminPersonEdit: "تحرير الشخصية",
  adminBasicInformation: "المعلومات الأساسية",
  adminArabicName: "الاسم بالعربية",
  adminEnglishName: "الاسم بالإنجليزية",
  adminSlug: "الرابط المختصر",
  adminShortBio: "النبذة المختصرة",
  adminBiography: "السيرة المنظمة",
  adminBirthDate: "تاريخ الميلاد",
  adminDeathDate: "تاريخ الوفاة",
  adminBirthPlace: "مكان الميلاد",
  adminDeathPlace: "مكان الوفاة",
  adminImageUrl: "رابط الصورة",
  adminImageUrlHint: "استخدم رابط HTTPS عامًا لمصدر صورة حقيقي ومرخّص فقط. رفع صور الشخصيات التحريرية يحتاج إعداد مزود الوسائط وبنية حفظ مخصصة.",
  adminOccupations: "المهن، مفصولة بفواصل",
  adminOccupationsHint: "اكتب كل مهنة في سطر أو افصل بينها بفواصل.",
  adminCategories: "التصنيفات",
  adminCategoryCreateTitle: "إضافة تصنيف",
  adminCategoryEditTitle: "تعديل التصنيف",
  adminCategoryName: "اسم التصنيف",
  adminCategoryDescription: "وصف التصنيف",
  adminCategoryPublicNote: "يُحفظ التصنيف الجديد كمنشور ليظهر في الموقع العام ونماذج الشخصيات.",
  adminCreateCategory: "إنشاء التصنيف",
  adminUpdateCategory: "حفظ التعديل",
  adminCategorySaved: "تم حفظ التصنيف.",
  adminNoCategories: "لا توجد تصنيفات بعد.",
  adminManageCategories: "إدارة التصنيفات",
  adminNotFound: "السجل المطلوب غير موجود.",
  adminSources: "المصادر",
  adminAddSource: "إضافة مصدر",
  adminSourceTitle: "عنوان المصدر",
  adminPublisher: "الناشر",
  adminSourceUrl: "رابط المصدر",
  adminPublicationDate: "تاريخ النشر",
  adminAccessedAt: "تاريخ الوصول",
  adminSourceType: "نوع المصدر",
  adminReliability: "تصنيف الموثوقية",
  adminReliabilityHigh: "مرتفع",
  adminReliabilityMedium: "متوسط",
  adminReliabilityLow: "منخفض",
  adminTimeline: "المسار الزمني",
  adminAddEvent: "إضافة حدث",
  adminEventDate: "تاريخ الحدث",
  adminEventTitle: "عنوان الحدث",
  adminEventDescription: "وصف الحدث",
  adminEducation: "التعليم",
  adminAddEducation: "إضافة تعليم",
  adminInstitution: "المؤسسة",
  adminField: "المجال أو البرنامج",
  adminDateRange: "الفترة",
  adminDescription: "الوصف",
  adminRemove: "حذف العنصر",
  adminSave: "حفظ التغييرات",
  adminSaving: "جارٍ الحفظ…",
  adminSaved: "تم الحفظ",
  adminCancel: "إلغاء",
  adminPreviewTitle: "معاينة تحريرية",
  adminPreviewDescription: "هذه المعاينة محمية ولا تظهر للعامة قبل النشر.",
  adminBackToEdit: "العودة إلى التحرير",
  adminDatabaseError: "تعذر الوصول إلى قاعدة البيانات الآن.",
  adminValidationError: "راجع الحقول المطلوبة والقيم غير الصالحة.",
  adminReadinessTitle: "جاهزية السجل",
  adminReadinessReady: "جاهز (READY)",
  adminReadinessIncomplete: "غير مكتمل (INCOMPLETE)",
  adminReadinessBlockedLabel: "محجوب (BLOCKED)",
  adminReadinessPublishHint: "للنشر: يلزم استكمال الاسم، الرابط، التصنيف، السيرة، ومصدر واحد على الأقل.",
  adminReadinessBlocked: "لا يمكن متابعة هذه الحالة قبل استكمال عناصر الجاهزية الظاهرة.",
  adminUnauthorized: "ليست لديك صلاحية الوصول إلى هذه المساحة.",
  adminStatusLabel: "حالة النشر",
  adminStatusTransitionError: "لا يسمح مسار التحرير بهذا الانتقال.",
  adminConflictError: "يوجد تعارض في السجل؛ راجع الرابط أو العملية الحالية.",
  adminSelectPlaceholder: "اختر…",
  adminNoSources: "أضف مصدرًا واحدًا على الأقل عند النشر.",
  adminNoTimeline: "لا توجد أحداث مضافة.",
  adminNoEducation: "لا توجد بيانات تعليمية مضافة.",
  adminPagePrevious: "السابق",
  adminPageNext: "التالي",
  adminUpdated: "آخر تحديث",
  adminCreated: "تاريخ الإنشاء",
  adminCredentialBoundary: "لا تُعرض كلمات المرور أو التجزئات أو رموز الجلسات في لوحة الإدارة.",
  adminCredentialLifecycleDeferred: "عمليات التفعيل وإعادة التعيين غير متاحة حتى يتم إعداد دورة credentials آمنة ومزود بريد معتمد.",
  adminOpaqueSessionId: "معرّف جلسة opaque",
  adminControlCenter: "مركز التحكم",
  adminControlCenterDescription: "مساحة تشغيل موحدة لإدارة المحتوى والملفات المهنية وإعدادات المنتج بأمان.",
  adminLaunchControl: "مركز الإطلاق والتشغيل",
  adminLaunchControlDescription: "قراءة موحدة لحالة النظام والاستعداد التشغيلي دون تنفيذ تغييرات تلقائية.",
  adminLaunchReadOnly: "قراءة فقط؛ لا توجد أزرار لتطبيق migrations أو الرفع أو الحذف أو provisioning.",
  adminLaunchStatus: "الحالة",
  adminLaunchDomainLabel: "المجال",
  adminLaunchMode: "نوع التحقق",
  adminLaunchDomainCountSuffix: "مجالات",
  adminLaunchEvidence: "الدليل",
  adminLaunchOwner: "المالك / الخطوة التالية",
  adminLaunchModeAutomatic: "تلقائي",
  adminLaunchModeManual: "مراجعة يدوية",
  adminLaunchModeExternal: "بيئة خارجية",
  adminLaunchReady: "جاهز",
  adminLaunchReadyWithLimitations: "جاهز مع قيود",
  adminLaunchRequiresConfiguration: "يتطلب إعدادًا",
  adminLaunchNotTested: "لم يُختبر",
  adminLaunchBlocked: "محجوب",
  adminLaunchNotApplicable: "غير منطبق",
  adminLaunchApplication: "التطبيق",
  adminLaunchDatabase: "قاعدة البيانات",
  adminLaunchMigrations: "الترحيلات",
  adminLaunchAuthentication: "المصادقة",
  adminLaunchRbac: "الصلاحيات والأدوار",
  adminLaunchEditorial: "المحتوى التحريري",
  adminLaunchMedia: "الوسائط",
  adminLaunchSeo: "SEO والبيانات الوصفية",
  adminLaunchSiteExperience: "تجربة الموقع",
  adminLaunchOperations: "التشغيل",
  adminLaunchPortability: "قابلية النقل",
  adminLaunchAndroid: "Android",
  adminLaunchDomain: "النطاق وDNS",
  adminLaunchPeopleReadiness: "جاهزية الشخصيات",
  adminLaunchRequiredFields: "الحقول الأساسية",
  adminLaunchRecommendedFields: "الحقول الموصى بها",
  adminLaunchSources: "المصادر",
  adminLaunchPortrait: "الصورة التعريفية",
  adminLaunchOpen: "فتح",
  adminLaunchChecklist: "قائمة التحقق التشغيلية",
  adminLaunchNoData: "لا تتوفر بيانات كافية لهذا المجال حاليًا.",
  adminLaunchLoading: "جارٍ قراءة حالة التشغيل…",
  adminLaunchError: "تعذر قراءة مركز الإطلاق. لم تُنفذ أي عملية تغيير.",
  adminLaunchNoMutation: "لم تُنفذ أي عملية تغيير من هذه الصفحة.",
  adminLaunchEvidenceApplication: "التطبيق الحالي يعمل؛ تحقق النشر والبناء الكامل موثق كدليل خارجي.",
  adminLaunchEvidenceDeployment: "تم التحقق من deployment خارجيًا دون تغيير إعدادات Vercel.",
  adminLaunchEvidenceProtected: "المسار محمي Server-side بواسطة system.read.",
  adminLaunchEvidenceMigration: "ترحيلات متوقعة ومطبقة ومعلقة كما يعرض registry الحالي.",
  adminLaunchEvidenceMigrationAction: "تتطلب أي migration معلقة إجراءً صريحًا مستقلًا؛ لا يوجد تنفيذ هنا.",
  adminLaunchEvidenceAuthentication: "حالة مصادقة Admin الحالية مشتقة من health read model.",
  adminLaunchEvidenceRbac: "تم تطبيق authorization Server-side وفق سجل RBAC الحالي.",
  adminLaunchEvidenceEditorial: "تم تقييم عينة محدودة من الشخصيات بواسطة Quality Gate الحتمي.",
  adminLaunchEvidenceMedia: "حالة provider وmetadata وupload وpublic delivery مشتقة من Media health الحالي.",
  adminLaunchEvidenceSeo: "canonical وmetadata وsitemap وrobots وJSON-LD موجودة؛ تحقق crawler خارجي.",
  adminLaunchEvidenceSiteExperience: "حالة draft وpublished وتجربة الموقع مشتقة من System Health.",
  adminLaunchEvidenceOperations: "توثيق backup وrestore موجود؛ التنفيذ والـdrill خارجيان.",
  adminLaunchEvidencePortability: "توثيق البيئة وDocker وself-hosting موجود؛ التحقق الخارجي معلق.",
  adminLaunchEvidenceAndroid: "أساس Android والتوثيق موجودان؛ SDK والبناء والتوقيع لم تُختبر هنا.",
  adminLaunchEvidenceDomain: "إجراءات النطاق وDNS موثقة؛ لم تُنفذ أي تغييرات خارجية.",
  adminLaunchNextStep: "الخطوة التالية",
  adminLaunchBackup: "النسخ الاحتياطي",
  adminLaunchRestore: "الاستعادة",
  adminLaunchMonitoring: "المراقبة",
  adminLaunchEmail: "البريد الإلكتروني",
  adminLaunchDocker: "Docker",
  adminLaunchCustomDomain: "النطاق المخصص",
  adminLaunchBuild: "إصدار البناء",
  adminLaunchHealth: "health endpoint",
  adminLaunchPublicRoutes: "المسارات العامة",
  adminPeopleGroup: "المحتوى التحريري",
  adminOperationsGroup: "التشغيل والمراجعة",
  adminProductGroup: "التحكم بالمنتج",
  adminSystemGroup: "النظام",
  adminUsers: "المستخدمون",
  adminProfiles: "الملفات المهنية",
  adminAdministrators: "المديرون",
  adminEditors: "المحررون",
  adminContent: "كل المحتوى",
  adminHomepage: "الصفحة الرئيسية",
  adminAppearance: "المظهر",
  adminMedia: "الوسائط والملفات",
  adminSeo: "تحسين الظهور",
  adminAudit: "سجل التدقيق",
  adminSystem: "حالة النظام",
  adminSettings: "الإعدادات",
  adminSiteExperienceDescription: "إدارة آمنة لإعدادات تجربة الموقع مع مسودة ونشر منفصلين.",
  adminSiteExperienceCenter: "تجربة الموقع",
  adminSiteExperienceCenterDescription: "مركز موحد لإدارة الهوية والصفحة الرئيسية والتنقل والتذييل والمظهر وSEO وعرض الملفات المهنية.",
  adminPublishDraft: "نشر المسودة",
  adminDraftVersion: "المسودة الحالية",
  adminPublishedVersion: "الإصدار المنشور",
  adminLastSaved: "آخر حفظ",
  adminIdentitySettings: "هوية الموقع",
  adminThemeSettings: "إعدادات المظهر",
  adminHomepageBuilder: "محرر الصفحة الرئيسية",
  adminNavigationManager: "إدارة التنقل",
  adminFooterManager: "إدارة التذييل",
  adminSeoManager: "إدارة SEO",
  adminProfilePresentationSettings: "عرض الملفات المهنية",
  adminSystemHealth: "حالة النظام",
  adminRecentActivity: "النشاط الأخير",
  adminModerationQueue: "طابور المراجعة",
  adminQuickActions: "إجراءات سريعة",
  adminMediaProvider: "مزود الوسائط",
  adminRequiresConfiguration: "يتطلب إعدادًا",
  adminVisible: "ظاهر",
  adminHidden: "مخفي",
  adminLabel: "التسمية",
  adminUrl: "الرابط",
  adminExternalLink: "رابط خارجي",
  adminSectionTitle: "عنوان القسم",
  adminSectionDescription: "وصف القسم",
  adminPublishConfirmation: "سيصبح هذا الإصدار ظاهرًا للعامة بعد النشر.",
  adminPublishSuccess: "تم نشر الإصدار بنجاح.",
  adminDraftSaved: "تم حفظ المسودة.",
  adminMoveUp: "نقل لأعلى",
  adminMoveDown: "نقل لأسفل",
  adminSiteName: "اسم الموقع",
  adminTagline: "الشعار الوصفي",
  adminDefaultLanguage: "اللغة الافتراضية",
  adminDirection: "اتجاه العرض",
  adminSupportEmail: "بريد الدعم",
  adminContactEmail: "بريد التواصل",
  adminLogo: "الشعار",
  adminFavicon: "أيقونة الموقع",
  adminShortName: "الاسم المختصر",
  adminBrandDescription: "وصف الهوية",
  adminTheme: "السمة",
  adminTypography: "الخطوط",
  adminSpacing: "المسافات",
  adminRadius: "استدارة الزوايا",
  adminNavigationStyle: "نمط التنقل",
  adminCardStyle: "نمط البطاقات",
  adminButtonStyle: "نمط الأزرار",
  adminHeroStyle: "نمط الواجهة الرئيسية",
  adminFooterStyle: "نمط التذييل",
  adminHero: "الواجهة الرئيسية",
  adminSearchSection: "قسم البحث",
  adminFeaturedSection: "المحتوى المختار",
  adminProfilesSection: "الملفات المهنية",
  adminCategoriesSection: "التصنيفات",
  adminAboutSection: "عن أعلام",
  adminFinalCta: "الدعوة الختامية",
  adminSelectionMode: "نمط الاختيار",
  adminItemLimit: "عدد العناصر",
  adminDisplayMode: "نمط العرض",
  adminHelperText: "النص المساعد",
  adminSeoTitle: "عنوان SEO",
  adminDefaultDescription: "الوصف الافتراضي",
  adminKeywords: "الكلمات المفتاحية",
  adminOgImage: "صورة المشاركة",
  adminTwitterCard: "بطاقة X/Twitter",
  adminCanonicalBase: "النطاق الأساسي للروابط",
  adminIndexingAllowed: "السماح بالفهرسة",
  adminTemplate: "القالب",
  adminSectionOrder: "ترتيب الأقسام",
  adminShowPortfolio: "عرض نماذج الأعمال",
  adminShowContact: "عرض زر التواصل",
  adminShowSocial: "عرض الروابط الاجتماعية",
  adminShowPrint: "عرض زر الطباعة",
  adminShowShare: "عرض أدوات المشاركة",
  adminPrimary: "الإجراء الأساسي",
  adminSecondary: "الإجراء الثانوي",
  adminCopyright: "حقوق النشر",
  adminLegalLinks: "الروابط القانونية",
  adminTokenPrimary: "اللون الأساسي",
  adminTokenAccent: "لون التمييز",
  adminTokenSurface: "لون السطح",
  adminTokenDensity: "كثافة العرض",
  adminTokenContainer: "عرض الحاوية",
  adminAddLink: "إضافة رابط",
  adminAddGroup: "إضافة مجموعة",
  adminAddSocialLink: "إضافة رابط اجتماعي",
  adminMediaSafetyNote: "تُحفظ metadata فقط عبر مزود تخزين خارجي؛ لا يوجد fallback إلى filesystem أو تخزين bytes في PostgreSQL.",
  adminMediaLibrary: "مكتبة الوسائط",
  adminMediaUpload: "رفع صورة رئيسية",
  adminMediaSelect: "اختر ملفًا",
  adminMediaCurrentPortrait: "الصورة الرئيسية الحالية",
  adminMediaAltText: "النص البديل",
  adminMediaSource: "مصدر الصورة",
  adminMediaAttribution: "نسبة الصورة",
  adminMediaLicense: "الترخيص أو الحقوق",
  adminMediaVisibility: "إتاحة عامة",
  adminMediaPublic: "عامة",
  adminMediaPrivate: "خاصة",
  adminMediaSaveMetadata: "حفظ بيانات الوسائط",
  adminMediaDetach: "إزالة الربط",
  adminMediaArchive: "أرشفة الأصل",
  adminMediaNoAssets: "لا توجد أصول وسائط في النطاق الحالي.",
  adminMediaNoProvider: "رفع الوسائط معطل حتى تتم تهيئة مزود التخزين.",
  adminMediaRequiresPersonId: "احفظ الشخصية أولًا قبل رفع الصورة.",
  adminMediaPendingMigration: "تحتاج بنية Media إلى تطبيق migration 0007 في هذه البيئة.",
  adminUnavailableTitle: "هذه الوظيفة غير مفعلة بعد",
  adminUnavailableDescription: "تحتاج هذه المساحة إلى بنية بيانات أو إعداد خارجي غير متاح في الإصدار الحالي.",
  adminRequiresSchema: "تحتاج تهيئة بنية البيانات",
  adminRequiresMigration: "تحتاج تطبيق migrations",
  adminReadOnly: "للقراءة فقط",
  adminDatabaseStatus: "حالة قاعدة البيانات",
  adminAuthStatus: "حماية الإدارة",
  adminMigrationStatus: "حالة migrations",
  adminSiteExperienceStatus: "إعدادات تجربة الموقع",
  adminAppliedMigrations: "migrations مطبقة",
  adminPendingMigrations: "migrations معلقة",
  adminExpectedMigrations: "إجمالي migrations المتوقعة",
  adminMigrationRegistryTitle: "سجل الترحيلات",
  adminMigrationRegistryDescription: "حالة بنية قاعدة البيانات مقارنة بملفات المشروع.",
  adminMigrationVersion: "Migration",
  adminMigrationRowStatus: "الحالة",
  adminMigrationAppliedAt: "تاريخ التطبيق",
  adminMigrationApplied: "مطبقة",
  adminMigrationPending: "معلقة",
  adminMigrationUnexpected: "غير متوقعة",
  adminMigrationInconsistent: "غير متسقة",
  adminMigrationUnavailable: "غير متاحة",
  adminMigrationRegistryHealthy: "سجل الترحيلات متوافق",
  adminMigrationRegistryPending: "توجد migrations معلقة",
  adminMigrationRegistryInconsistent: "سجل الترحيلات غير متسق",
  adminMigrationRegistryUnavailable: "تعذر قراءة سجل migrations الآن.",
  adminMigrationNoAppliedAt: "—",
  adminMigrationControlTitle: "التحكم في الترحيلات",
  adminMigrationControlDescription: "تشغيل ترحيل واحد فقط بعد فحص الخوادم والمتطلبات، باستخدام runner المعتمد.",
  adminMigrationPreflight: "الفحص المسبق",
  adminMigrationPrerequisites: "المتطلبات",
  adminMigrationNext: "الترحيل التالي",
  adminMigrationAuthorization: "التفويض",
  adminMigrationExecution: "التنفيذ",
  adminMigrationDatabase: "قاعدة البيانات",
  adminMigrationRegistry: "السجل",
  adminMigrationAuthorized: "مصرح",
  adminMigrationNotAuthorized: "غير مصرح",
  adminMigrationReady: "جاهز للتنفيذ",
  adminMigrationBlocked: "التنفيذ محظور",
  adminMigrationPrerequisiteMissing: "التنفيذ محظور حتى اكتمال المتطلبات السابقة.",
  adminMigrationNoPending: "لا توجد migrations معلقة.",
  adminMigrationExecuteButton: "تشغيل الترحيل التالي",
  adminMigrationConfirmPrompt: "أؤكد تشغيل الترحيل التالي فقط",
  adminMigrationSuccess: "تم تشغيل الترحيل التالي وتسجيله.",
  adminMigrationFailure: "تعذر تنفيذ الترحيل. تم إيقاف التنفيذ.",
  adminMigrationStopped: "لم يتم اعتماد التغيير.",
  adminPublishedResources: "موارد منشورة",
  adminDraftResources: "موارد مسودة",
  adminAvailable: "متاحة",
  adminUnavailable: "غير متاحة",
  adminNoUsers: "لا توجد حسابات مستخدمين في النطاق الحالي.",
  adminPeopleRelated: "شخصيات مرتبطة",
  adminProfilesRelated: "ملفات مرتبطة",
  adminIdentityStatus: "حالة الهوية",
  adminStatusInvited: "مدعو — يحتاج تفعيلًا",
  adminStatusActive: "نشط",
  adminStatusDisabled: "معطل",
  adminRole: "الدور",
  adminRoleSuperAdmin: "Super Admin",
  adminRoleAdmin: "Admin",
  adminRoleEditor: "Editor",
  adminRoleModerator: "Moderator",
  adminCreateIdentity: "إضافة هوية إدارية",
  adminIdentityName: "الاسم المعروض",
  adminIdentityEmail: "البريد الإداري",
  adminIdentityRequiresActivation: "لا يوجد مسار دعوة أو تفعيل credentials في Phase 17.1؛ ستُحفظ الهوية كمدعو فقط.",
  adminChangeRole: "تغيير الدور",
  adminDisable: "تعطيل",
  adminEnable: "تفعيل",
  adminSessions: "الجلسات",
  adminRevoke: "سحب",
  adminNoSessions: "لا توجد جلسات Admin فعالة.",
  adminSessionExpires: "تنتهي",
  adminSessionDevice: "الجهاز",
  adminSessionAddress: "العنوان الشبكي",
  adminRevokeUserSessions: "سحب جلسات المستخدم",
  adminUserStatus: "حالة الحساب",
  adminUserActive: "نشط",
  adminUserDisabled: "معطل",
  adminNoAdminIdentities: "لا توجد هويات Admin في النطاق الحالي.",
  adminNoEditors: "لا توجد هويات Editor في النطاق الحالي.",
  adminPermissionMatrix: "مصفوفة الصلاحيات",
  adminPermissionMatrixDescription: "مرجع للسياسة المركزية الحالية؛ لا تُعرض مربعات تعديل قبل توفر persisted permission assignment.",
  adminPermissionRole: "الدور",
  adminPermissionCode: "الصلاحية",
  adminUserDetail: "تفاصيل المستخدم",
  adminAccountOverview: "نظرة عامة على الحساب",
  adminProfileOverview: "الملف المهني",
  adminSecurity: "الأمان",
  adminCompletion: "اكتمال الملف",
  adminActiveSessions: "الجلسات الفعالة",
  adminAuditEvents: "أحداث التدقيق",
  adminView: "عرض",
  adminRevokeAllSessions: "سحب كل الجلسات",
  adminSuspendUser: "تعطيل الحساب",
  adminReactivateUser: "إعادة تفعيل الحساب",
  adminPermissionOverrides: "تجاوزات الصلاحيات",
  adminDefaultPermissions: "الصلاحيات الافتراضية",
  adminEffectivePermissions: "الصلاحيات الفعلية",
  adminPermissionAllow: "سماح",
  adminPermissionDeny: "منع",
  adminSavePermissions: "حفظ الصلاحيات",
  adminPermissionSaved: "تم حفظ الصلاحيات.",
  adminPermissionConfiguration: "تحتاج إدارة الصلاحيات إلى تطبيق migration 0005 وتهيئة آمنة؛ لا يوجد تعديل متاح في هذه البيئة.",
  adminConfirmationNeeded: "يرجى تأكيد العملية الحساسة قبل المتابعة.",
  adminAuditFilters: "تصفية سجل التدقيق",
  adminAuditActor: "الفاعل",
  adminAuditAction: "الإجراء",
  adminAuditEntity: "الكيان",
  adminAuditFrom: "من تاريخ",
  adminAuditTo: "إلى تاريخ",
  adminClearFilters: "مسح التصفية",
  adminNoAudit: "لا توجد أحداث تدقيق في النطاق الحالي.",
  adminSessionStatus: "حالة الجلسة",
  adminCurrentSession: "الجلسة الحالية",
  adminSessionActive: "نشطة",
  adminSessionRevoked: "مسحوبة",
  adminSessionExpired: "منتهية",
  adminAllSessions: "كل الجلسات",
  adminProfileStatus: "حالة الملف",
  adminVisibility: "الظهور",
  adminVisibilityPrivate: "خاص",
  adminVisibilityUnlisted: "غير مدرج",
  adminVisibilityPublished: "عام",
  adminHasProfile: "الملف المهني",
  adminWithProfile: "لديه ملف",
  adminWithoutProfile: "بلا ملف",
  adminCompletionShort: "الاكتمال",
  adminAi: "A3LAM AI",
  adminAiActivation: "تفعيل المعالجة الإنتاجية",
  adminAiActivationDisabled: "معالجة AI الإنتاجية غير مفعّلة.",
  adminAiActivationEnabled: "مفعّلة",
  adminAiDescription: "منشئ الملفات الذكية — أساس آمن لاستخلاص المعلومات من المستندات ومراجعتها بشريًا.",
  adminAiProvider: "مزود الذكاء الاصطناعي",
  adminAiDocumentProcessing: "معالجة المستندات",
  adminAiPrivacyNotice: "المستندات الخاصة افتراضية؛ لا تُنشر ولا تظهر في البحث أو sitemap أو البيانات الوصفية العامة.",
  adminAiCreateFromDocument: "إنشاء ملف من مستند",
  adminAiConfigurationRequired: "هذه الميزة قيد التهيئة؛ لم يتم إعداد مزود AI أو مسار التخزين/المعالجة الكامل.",
  adminAiDocuments: "المستندات",
  adminAiProcessing: "قيد المعالجة",
  adminAiCompleted: "مكتملة",
  adminAiFailed: "فشلت",
  adminAiReviewRequired: "تحتاج مراجعة",
  adminAiNoDocuments: "لا توجد بيانات بعد.",
  adminAiUploadHint: "يدعم العقد المستقبلي PDF وDOCX وTXT. الرفع الإنتاجي معطل حتى تهيئة التخزين والمعالجة.",
  adminAiSupportedTypes: "الأنواع المدعومة في العقد",
  adminAiHumanReview: "مراجعة بشرية",
  adminAiDraftBoundary: "أي ناتج مستقبلي يدخل كمسودة ولا ينتقل تلقائيًا إلى النشر.",
  adminAiNoInference: "لم تُنفذ أي عملية inference أو اتصال بمزود AI في هذه المرحلة.",
  adminAiNoPersistence: "لم تُنشأ persistence لمهام AI بعد؛ لذلك لا نعرض عدادات اصطناعية.",
  adminAiRequiresMigration: "تحتاج persistence إلى migration additive غير مطبقة في Production.",
  adminAiQueue: "طابور المعالجة",
  adminAiMalwareScanning: "فحص البرمجيات الضارة",
  adminAiRetention: "سياسة الاحتفاظ",
  adminAiDocumentStatus: "حالة المستند",
  adminAiNoDocumentSelected: "اختر مستندًا لمراجعة تفاصيله الخاصة.",
  adminAiReviewStart: "بدء المراجعة البشرية",
  adminAiReviewUnavailable: "لا تتوفر بيانات المراجعة قبل تطبيق migration المطلوبة.",
  adminAiExtractedText: "النص المستخرج الخاص",
  adminAiNoExtractedText: "لا يوجد نص مستخرج متاح للمراجعة.",
  adminAiRetry: "إعادة المحاولة",
  adminAiUploadProgress: "تقدم العملية",
  adminAiUnsupportedType: "نوع الملف غير مدعوم. استخدم PDF أو DOCX أو TXT.",
  adminAiInvalidSize: "حجم الملف غير مسموح.",
  adminAiRemoveSelection: "إزالة الاختيار",
  adminAiStructuredFields: "الهوية · المجال المهني · التعليم · المسار الوظيفي · الإنجازات · الجوائز · المنشورات · المهارات · اللغات · الروابط · المصادر",
  adminAiExtractionCapability: "قدرة الاستخلاص",
  adminAiParserStatus: "حالة المحللات",
  adminAiLimits: "الحدود الوقائية: 10MB للملف · 8MB للنص · 100 صفحة PDF · 5,000 فقرة · 500 خلية جدول · 200 عنصر DOCX",
  adminAiParserAvailable: "متاح محليًا للاختبار المعزول فقط",
  adminAiParserUnavailable: "غير متاح حاليًا",
  adminAiReviewField: "الحقل",
  adminAiReviewValue: "القيمة المقترحة",
  adminAiReviewSource: "المصدر / الدليل",
  adminAiReviewConfidence: "الثقة",
  adminAiReviewClassification: "التصنيف",
  adminAiReviewAction: "الإجراء",
  adminAiAccept: "قبول",
  adminAiEdit: "تعديل وقبول",
  adminAiReject: "رفض",
  adminAiReviewSaving: "جارٍ حفظ قرار المراجعة…",
  adminAiReviewError: "تعذر حفظ قرار المراجعة.",
  adminAiReviewNote: "ملاحظة المراجع",
  adminAiNoFacts: "لا توجد معلومات مستخرجة للمراجعة بعد.",
  adminAiGeneration: "التوليد المنظم",
  adminAiGenerationProvider: "حالة مزود التوليد",
  adminAiGenerationModes: "أنماط التوليد: سيرة مهنية · ملف مهني · مسودة شخصية A3LAM · سيرة مختصرة · مسودة SEO",
  adminAiOutputLanguages: "لغات الإخراج: العربية · الإنجليزية · ثنائي اللغة · لغة المصدر",
  adminAiGenerationDisabled: "التوليد معطل حتى تهيئة مزود مصرح به وتهيئة persistence الخاصة.",
  adminAiGenerationDraft: "أي ناتج توليد يبقى مسودة DRAFT ولا يُنشر تلقائيًا.",
  adminAiGenerationQuality: "بوابة جودة الناتج",
  adminAiGenerationClaims: "الادعاءات الناتجة",
  adminAiGenerationNoClaims: "لا توجد ادعاءات توليد قابلة للمراجعة.",
  adminAiGenerationReview: "مراجعة الادعاء: المصدر ← المعلومة ← التفسير ← الادعاء ← القرار",
  adminAiRequestSource: "طلب مصدر",
  adminAiConflict: "متعارض ويحتاج مراجعة بشرية",
  adminAiPipeline: "مسار المعالجة",
  adminAiPipelineUploaded: "مرفوع",
  adminAiPipelineExtracted: "مستخرج",
  adminAiPipelineFacts: "الحقائق",
  adminAiPipelineGeneration: "التوليد",
  adminAiPipelineReview: "المراجعة",
  adminAiPipelineApproved: "معتمد كمسودة",
  adminAiGenerationStatus: "حالة التوليد",
  adminAiQualityGate: "بوابة الجودة",
  adminAiBack: "رجوع",
  adminAiLocalOnly: "محلي فقط",
  adminAiChooseLocalFile: "اختيار ملف محلي",
  adminAiOcrNotice: "PDF بلا طبقة نص يحتاج OCR؛ OCR غير مهيأ حاليًا.",
  adminAiDocxNotice: "DOCX يخضع لحدود الأرشيف والفقرة والجدول؛ الملفات غير الآمنة تُرفض.",
  adminAiSourceA: "المصدر A",
  adminAiSourceB: "المصدر B",
  adminAiBoundaryDraftPerson: "مسودة AI ليست شخصية",
  adminAiBoundaryDraftProfile: "مسودة AI ليست ملفًا منشورًا",
  adminAiBoundaryDraftPublished: "مسودة AI ليست محتوى منشورًا",
  adminAiDraftStatus: "مسودة / DRAFT",
  adminAiLanguageArabic: "العربية",
  adminAiLanguageEnglish: "الإنجليزية",
  adminAiLanguageBilingual: "ثنائي اللغة",
  adminAiLanguageSource: "لغة المصدر",
  adminAiModeProfessionalCvDescription: "ينظم الخبرات والتعليم في سيرة مهنية قابلة للمراجعة.",
  adminAiModeProfessionalProfileDescription: "يبني ملفًا مهنيًا تحريريًا موجزًا ومدعومًا بالمصدر.",
  adminAiModePersonDraftDescription: "مسودة بنية لشخصية A3LAM مستقبلية، وليست Person أو Profile منشورًا.",
  adminAiModeBiographyDescription: "يقترح سيرة مختصرة مع إبقاء كل claim تحت المراجعة.",
  adminAiModeSeoDescription: "ينشئ حقولًا تحريرية لمسودة SEO دون نشر تلقائي.",
  adminAiEditedSuffix: "محررة",
  adminAiWorkspaceTitle: "مساحة العمل التحريرية",
  adminAiWorkspaceDescription: "مسار خاص ومتعدد الخطوات لفهم المصدر ومراجعة الحقائق وبناء مسودة قبل أي قرار تحريري لاحق.",
  adminAiStepDocument: "المستند",
  adminAiStepExtraction: "الاستخلاص",
  adminAiStepFacts: "الحقائق",
  adminAiStepGeneration: "التوليد",
  adminAiStepDraft: "المسودة",
  adminAiStepClaims: "الادعاءات",
  adminAiStepReview: "المراجعة",
  adminAiRunIsolatedDemo: "تشغيل العرض المعزول",
  adminAiLocalDemoNotice: "هذا عرض محلي معزول باستخدام بيانات اصطناعية فقط. لا يتم رفع ملف ولا إنشاء سجل Production.",
  adminAiDropzoneHint: "اختر PDF أو DOCX أو TXT للمراجعة المحلية؛ الرفع الإنتاجي معطل.",
  adminAiSelectedDocument: "المستند المحدد",
  adminAiDetectedLanguage: "اللغة المكتشفة",
  adminAiProcessingState: "حالة المعالجة",
  adminAiSections: "الأقسام",
  adminAiParagraphs: "الفقرات",
  adminAiOpenSource: "فتح المصدر",
  adminAiEvidenceUnavailable: "الدليل غير متاح — المراجعة مطلوبة.",
  adminAiConflictDetected: "تم اكتشاف تعارض",
  adminAiNeedsHumanReview: "يحتاج مراجعة بشرية",
  adminAiGenerationChooseMode: "اختر نمط المسودة",
  adminAiGenerationChooseLanguage: "اختر لغة الإخراج",
  adminAiModeProfessionalCv: "سيرة مهنية منظمة",
  adminAiModeProfessionalProfile: "ملف مهني تحريري",
  adminAiModePersonDraft: "مسودة شخصية A3LAM المستقبلية",
  adminAiModeBiography: "سيرة موجزة",
  adminAiModeSeo: "مسودة SEO",
  adminAiReadiness: "جاهزية التفعيل الإنتاجي",
  adminAiReadinessDescription: "مصفوفة صادقة لحالة الاعتماديات والبوابات قبل أي تفعيل إنتاجي.",
  adminAiReadinessStatus: "الحالة",
  adminAiReadinessReason: "السبب",
  adminAiReadinessEvidence: "الدليل",
  adminAiReadinessNextStep: "الخطوة التالية",
  adminAiReadinessOwner: "المالك",
  adminAiReadinessVerificationMethod: "طريقة التحقق",
  adminAiReadinessLayer: "طبقة الجاهزية",
  adminAiReadinessRisk: "مستوى الخطر",
  adminAiDecisionNotTested: "لم يُختبر",
  adminAiReadinessBlocker: "مانع تفعيل",
  adminAiReadinessNoBlocker: "لا يوجد مانع مثبت",
  adminAiReadinessInfrastructure: "البنية التحتية",
  adminAiReadinessApplication: "التطبيق",
  adminAiReadinessSecurity: "الأمن",
  adminAiReadinessOperations: "التشغيل",
  adminAiReadinessMigration: "سجل migrations",
  adminAiReadinessGate: "بوابات التفعيل",
  adminAiGateUpload: "رفع المستندات",
  adminAiGateProcessing: "المعالجة",
  adminAiGateGeneration: "التوليد",
  adminAiGateOcr: "OCR",
  adminAiGatePublication: "النشر",
  adminAiGateOff: "OFF / معطل",
  adminAiDecisionActivationReady: "ACTIVATION READY",
  adminAiDecisionActivationReadyWithLimitations: "ACTIVATION READY WITH LIMITATIONS",
  adminAiDecisionNotReady: "NOT READY",
  adminAiDecisionBlocked: "BLOCKED",
  adminAiReadinessAuthentication: "المصادقة",
  adminAiReadinessCsrf: "حماية CSRF / المصدر نفسه",
  adminAiReadinessDocumentIngestion: "إدخال المستندات",
  adminAiReadinessClaimsProvenance: "الادعاءات ومصدرها",
  adminAiReadinessWorkflowStateMachine: "آلة حالات سير العمل",
  adminAiReadinessExternalQa: "اختبارات QA الخارجية",
  adminAiReadinessAiProvider: "مزود AI",
  adminAiReadinessPrivateStorage: "التخزين الخاص",
  adminAiReadinessMalwareScanner: "فحص البرمجيات الضارة",
  adminAiReadinessQueue: "طابور المعالجة",
  adminAiReadinessWorker: "العامل الخلفي",
  adminAiReadinessOcr: "OCR",
  adminAiReadinessPersistence: "Persistence",
  adminAiReadinessMigrations: "Migrations",
  adminAiReadinessRetention: "الاحتفاظ والحذف",
  adminAiReadinessRateLimits: "حدود المعدل",
  adminAiReadinessCostControls: "ضوابط التكلفة",
  adminAiReadinessObservability: "الرصد التشغيلي",
  adminAiReadinessAudit: "سجل التدقيق",
  adminAiReadinessRbac: "RBAC",
  adminAiReadinessPrivacy: "الخصوصية والعزل العام",
  adminAiReadinessPromptBoundary: "حدود prompt والبيانات غير الموثوقة",
  adminAiReadinessExtraction: "الاستخلاص",
  adminAiReadinessGeneration: "التوليد",
  adminAiReadinessHumanReview: "المراجعة البشرية",
  adminAiReadinessPublication: "سلامة النشر",
  adminAiReadinessPublicationGuard: "Publication Guard",
  adminAiReadinessRollback: "Rollback",
  adminAiRunGeneration: "إنشاء مسودة محلية",
  adminAiSourceBacked: "مدعوم بالمصدر",
  adminAiNeedsVerification: "يحتاج تحققًا",
  adminAiAiWording: "صياغة مولدة تحتاج مراجعة",
  adminAiFinalPrivateDraft: "مسودة خاصة نهائية",
  adminAiPrivateDraftNotice: "هذا الملف مسودة خاصة ولم يتم نشره.",
  adminAiSourceFact: "الحقيقة المصدرية",
  adminAiGeneratedClaim: "الادعاء الناتج",
  adminAiClaimAccept: "قبول",
  adminAiClaimEdit: "تعديل وقبول",
  adminAiClaimReject: "رفض",
  adminAiClaimRequestSource: "طلب مصدر",
  adminAiEditorialReadiness: "الجاهزية التحريرية",
  adminAiIdentityCheck: "الهوية",
  adminAiSourcesCheck: "المصادر",
  adminAiEvidenceCheck: "الأدلة",
  adminAiConflictsCheck: "التعارضات",
  adminAiClaimsCheck: "الادعاءات",
  adminAiCompletenessCheck: "الاكتمال",
  adminAiPrivacyCheck: "الخصوصية",
  adminAiPublicationCheck: "النشر",
  adminAiPass: "ناجح",
  adminAiWarning: "تحذير",
  adminAiBlocked: "محجوب",
  adminAiProductionDisabled: "AI Production Processing غير مفعّل.",
  adminAiMockAvailable: "Mock AI متاح للاختبار المعزول فقط.",
  adminAiReviewRequiredBeforeProceed: "تحتاج هذه الخطوة إلى مراجعة بشرية قبل المتابعة.",
  adminAiNoLocalDraft: "لا توجد مسودة محلية بعد.",
  adminAiDemoGenerated: "تم إنشاء مسودة محلية؛ بقيت خاصة وبحالة DRAFT.",
  adminAiWorkflowIntro: "اتبع مسارًا واضحًا من المصدر إلى مسودة قابلة للمراجعة — دون نشر تلقائي.",
  adminAiSandboxLabel: "SANDBOX · بيانات اصطناعية فقط",
  adminAiProgress: "تقدم المسار",
  adminAiStepOf: "الخطوة {current} من {total}",
  adminAiNextAction: "الخطوة التالية",
  adminAiModeSelected: "النمط المحدد",
  adminAiLocalFileSelected: "تم اختيار ملف محلي. هذا العرض لا يرفعه ولا يعالجه؛ استخدم العرض الاصطناعي المعزول للمتابعة.",
  adminAiOriginalValue: "القيمة الأصلية",
  adminAiReviewedValue: "القيمة بعد المراجعة",
  adminAiDecision: "قرار المراجع",
  adminAiSaveDraft: "حفظ كمسودة محلية",
  adminAiContinueReview: "متابعة المراجعة",
  adminAiFinalBoundary: "حفظ محلي فقط · لا إنشاء Person/Profile · لا نشر",
  adminAiSourceCoverage: "تغطية المصادر",
  adminAiUnresolved: "غير محسوم",
  adminAiRejected: "مرفوض",
  adminAiEdited: "معدل",
  adminAiReviewer: "المراجع",
  adminAiUnsavedChanges: "لديك تغييرات محلية غير محفوظة.",
  adminAiLocalStateAvailable: "تمت استعادة حالة محلية من هذا المتصفح.",
  adminAiResumeLocal: "متابعة الحالة المستعادة",
  adminAiDiscardLocal: "حذف الحالة المحلية",
  adminAiSavedLocally: "تم الحفظ محليًا في هذا المتصفح فقط.",
  adminAiLocalSaveFailed: "تعذر الحفظ محليًا في هذا المتصفح.",

};

const en: FoundationMessages = {
  brandEyebrow: "A3LAM / FOUNDATION",
  brandName: "System foundation",
  siteEyebrow: "Arabic encyclopedia · professional profiles",
  siteName: "A3LAM",
  phaseStatus: "Trusted knowledge platform",
  heroEyebrow: "Discover Arab impact",
  heroTitle: "A3LAM — Arab people and professional profiles",
  heroLede:
    "Discover Arab people, search for professionals, and create your CV in one trusted space. Professional profiles are published after review and clear source attribution.",
  primaryAction: "Explore people",
  secondaryAction: "Browse categories",
  scopeKicker: "Editorial principle",
  scopeTitle: "Accuracy before volume",
  scopeDescription: "Structured profiles · clear sources · human review",
  samplesEyebrow: "Foundation samples",
  samplesTitle: "A visual language built to scale",
  sampleArabicLabel: "Arabic RTL",
  sampleArabicValue: "Welcome to the A3LAM foundation",
  sampleMixedLabel: "Mixed Arabic/Latin",
  sampleMixedValue: "A3LAM — Knowledge encyclopedia",
  sampleNumbersLabel: "Numbers",
  sampleNumbersValue: "2026 · 01 · 22.13.0",
  tokensEyebrow: "Semantic tokens",
  tokensTitle: "A visual language built to scale",
  tokenInk: "Ink / primary text",
  tokenBrand: "Brand / primary color",
  tokenAccent: "Accent / emphasis",
  footerRtl: "Arabic right-to-left experience",
  footerNote: "© A3LAM · Arabic biographical encyclopedia",
  navHome: "Home",
  navPeople: "Explore",
  navCategories: "Categories",
  navAbout: "About A3LAM",
  navSearch: "Search",
  navCreateProfile: "Create your CV",
  navMyProfile: "My profile",
  navLogout: "Sign out",
  navLogin: "Sign in",
  navSigningOut: "Signing out…",
  homeAudience: "Arabic encyclopedia + professional CV platform",
  homeCreateProfile: "Create your CV",
  homeExplore: "Explore A3LAM",
  editorUnsaved: "You have unsaved changes",
  editorSaved: "Draft saved",
  editorSaving: "Saving draft…",
  editorSaveHint: "Save your draft before leaving so you do not lose your work.",
  editorReadinessTitle: "Profile readiness",
  editorReady: "Ready for review",
  editorIncomplete: "Needs completion",
  editorMissing: "Remaining",
  editorReadinessAdvisory: "The completion percentage is advisory and does not change review or publication rules.",
  moderationSearchPlaceholder: "Search by name, title, or city…",
  moderationAllCategories: "All categories",
  moderationSortLabel: "Sort results",
  moderationSortUpdated: "Recently updated",
  moderationSortCompletion: "Most complete",
  moderationSortName: "Name A–Z",
  moderationShowing: "Showing",
  moderationNoMatch: "No profiles match the current filters.",
  profileShare: "Share profile",
  profileCopyLink: "Copy link",
  profilePrint: "Print profile",
  profileCopied: "Profile link copied",
  profileShareFailed: "Sharing failed; you can copy the link manually.",
  profileContact: "Contact professionally",
  profileContactHint: "Only a contact method explicitly enabled by the profile owner is opened.",
  visibilityPublic: "Public",
  visibilityPublicHint: "Anyone can find your profile through search and categories.",
  visibilityUnlisted: "Unlisted",
  visibilityUnlistedHint: "Anyone with the link can view your profile, but it will not appear in search.",
  visibilityPrivate: "Private",
  visibilityPrivateHint: "Your profile is not available publicly.",
  moderationAllVisibility: "All visibility modes",
  moderationAllCountries: "All countries",
  moderationAllCities: "All cities",
  moderationSortOldest: "Oldest update",
  accountWelcomeTitle: "Welcome to A3LAM",
  accountWelcomeDescription: "Your next step is clear: create your professional profile and share your experience.",
  menuLabel: "Open menu",
  closeMenu: "Close menu",
  searchLabel: "Search A3LAM",
  searchPlaceholder: "Search a name, profession, or city...",
  searchAction: "Search",
  retryAction: "Try again",
  searchHint: "Try a name or field to discover reviewed profiles",
  searchResults: "Search results",
  searchEmpty: "No match in the current published records.",
  searchLoading: "Searching published records...",
  searchError: "Search is unavailable right now. Try again.",
  searchFilterLabel: "Category",
  searchAllCategories: "All categories",
  searchPageTitle: "Explore A3LAM",
  searchPageDescription: "Search published records and continue to profiles with clear source attribution.",
  searchPageBack: "Back to discovery",
  searchNoResultsHint: "Try a shorter name or choose a different field from the categories.",
  searchEmptyQuery: "Enter a name or choose at least one filter to start searching.",
  clearSearch: "Clear search",
  closeSearch: "Close search",
  searchCity: "City",
  searchCityPlaceholder: "Example: Sana'a",
  searchCountry: "Country",
  searchCountryPlaceholder: "Example: Yemen",
  searchProfessional: "Professional profile",
  searchEditorial: "Editorial record",
  searchLocationLabel: "Location",
  searchSkillsLabel: "Skills",
  heroCta: "Explore people",
  heroSecondary: "How we verify",
  statsPeople: "published records",
  statsPublishedPeople: "published records",
  statsCategories: "published fields",
  statsCountries: "future Arab expansion",
  featuredEyebrow: "Selected profiles",
  featuredTitle: "People worth knowing",
  featuredDescription: "Published profiles appear here after editorial review and source attribution.",
  featuredEmpty: "No published profiles are available in the current catalog yet.",
  dataUnavailable: "The published catalog is unavailable right now.",
  viewAll: "View directory",
  profileStatus: "Display sample",
  profileStatusNote: "Demo data to explain the interface — not a published profile.",
  publishedProfileStatus: "Published profile",
  samplePersonOneName: "Sample profile one",
  samplePersonOneRole: "Media & Journalism",
  samplePersonOneMeta: "Yemen · under review",
  samplePersonTwoName: "Sample profile two",
  samplePersonTwoRole: "Academia & Research",
  samplePersonTwoMeta: "Yemen · under review",
  samplePersonThreeName: "Sample profile three",
  samplePersonThreeRole: "Culture & Arts",
  samplePersonThreeMeta: "Yemen · under review",
  categoriesEyebrow: "Explore by field",
  categoriesTitle: "Every impact has a context",
  categoriesDescription: "Move through fields to discover people, ideas, and achievements in their professional and cultural context.",
  categoriesPageTitle: "Categories and fields",
  categoriesPageDescription: "A structured entry point to the knowledge fields represented by published A3LAM profiles.",
  categoryPeopleTitle: "People in this field",
  categoryResults: "published profiles",
  categoryNoPeople: "No published profiles are available in this field yet.",
  categoryMedia: "Media & Journalism",
  categoryAcademia: "Academia & Research",
  categoryCulture: "Culture & Arts",
  categoryBusiness: "Business & Economy",
  categorySociety: "Society & Impact",
  categorySports: "Sports",
  categoryScience: "Science & Technology",
  categoryCountSuffix: "knowledge paths",
  ctaEyebrow: "Help build the record",
  ctaTitle: "Have a sourced fact? Help it travel.",
  ctaDescription: "A3LAM grows through careful sources and responsible corrections. Contribution tools will arrive within editorial review.",
  ctaAction: "Learn more",
  trustEyebrow: "Why A3LAM",
  trustSourcesTitle: "Sourced knowledge",
  trustSourcesDescription: "We connect records to clear sources and keep each fact traceable.",
  trustArabicTitle: "Arabic first",
  trustArabicDescription: "A calm interface designed for reading Arabic names and biographies clearly.",
  trustGrowthTitle: "Built to grow",
  trustGrowthDescription: "A structured foundation for new people and fields without losing context.",
  discoveryEyebrow: "Discovery path",
  discoveryTitle: "A journey through Arab knowledge",
  discoveryDescription: "Periods, events, and published profiles will connect in a deeper timeline once the required structured data exists.",
  discoveryDeferredLabel: "In preparation",
  discoveryDeferred: "The timeline view needs published period and event data, so we do not show unverified items today.",
  discoverySearchAction: "Start searching",
  discoveryCategoriesAction: "Explore fields",
  footerTagline: "An Arabic platform for understanding people and their impact.",
  footerExplore: "Explore",
  footerContribute: "Contribute",
  footerAbout: "The project",
  footerContact: "Contact",
  footerPrivacy: "Privacy",
  footerRights: "All rights reserved",
  demoLabel: "Display sample",
  demoDataNote: "These samples are not published person profiles.",
  publishedDataNote: "Only published records with verified source links appear here.",
  profileView: "View profile",
  profileOverview: "Overview",
  profileFacts: "Profile facts",
  profileOccupation: "Occupation and field",
  profileBirth: "Born",
  profileDeath: "Died",
  profileCategories: "Categories",
  profileRecordId: "Internal record ID",
  profileLastUpdated: "Last updated",
  profileNoBiography: "No extended overview is available for this profile yet.",
  profileNoTimeline: "No published timeline events are available yet.",
  profileNoEducation: "No published education records are available yet.",
  profileNoSources: "No published sources are available yet.",
  profileRelatedCategories: "Related fields",
  profileRelatedPeople: "Related profiles",
  profileSourceAccess: "Open source",
  personPageTitle: "Sample person profile page",
  personPageLede: "A neutral profile surface showing the public structure before it connects to published data and approved sources.",
  backToDirectory: "Back to directory",
  timelineLabel: "Timeline",
  educationLabel: "Education & experience",
  sourcesLabel: "Sources & verification",
  sourceOfficial: "Official",
  sourceInstitution: "Institution",
  sourceGovernment: "Government",
  sourceMedia: "Media",
  sourceProfessional: "Professional",
  sourceAcademic: "Academic",
  sourceSecondary: "Secondary",
  notPublished: "Not published yet",
  notFoundEyebrow: "404 / A3LAM",
  notFoundTitle: "This page does not exist",
  notFoundDescription: "We could not find the requested profile or route.",
  notFoundAction: "Return home",
  aboutTitle: "About A3LAM",
  aboutDescription: "A3LAM is an Arabic encyclopedia built around structured profiles, clear sources, and human review before publication.",
  contactTitle: "Contact A3LAM",
  contactDescription: "For editorial questions or source suggestions, use the channels announced at launch. This page does not currently collect sensitive information.",
  privacyTitle: "Privacy",
  privacyDescription: "We follow data minimization and do not expose sensitive personal information or private contact methods. A detailed privacy policy will be published before public launch.",
  infoPageNextEyebrow: "Next step",
  infoPageNextTitle: "Start with published profiles",
  infoPageNextDescription: "Browse available records or move through the fields to discover source-linked knowledge.",
  infoPageNextAction: "Explore people",
  adminTitle: "Editorial workspace",
  adminSubtitle: "Manage A3LAM encyclopedia content",
  adminLoginTitle: "Editorial workspace sign-in",
  adminLoginDescription: "This space is limited to authorized editors.",
  adminAccessToken: "Editorial access token",
  adminLoginAction: "Sign in",
  adminLogout: "Sign out",
  adminAccessUnavailable: "Editorial access is not configured in this environment.",
  adminInvalidAccess: "The access token is invalid or expired.",
  adminDashboard: "Editorial dashboard",
  adminPeople: "People",
  adminAddPerson: "Add person",
  adminReviewContent: "Review content",
  adminPublished: "Published",
  adminDraft: "Draft",
  adminReview: "In review",
  adminArchived: "Archived",
  adminRecentUpdates: "Recent updates",
  adminNoPeople: "There are no people in the current records.",
  adminNoRecent: "There are no recent updates.",
  adminPeopleCount: "Total people",
  adminSearch: "Internal search",
  adminFilterStatus: "Filter by status",
  adminAllStatuses: "All statuses",
  adminAllCategories: "All categories",
  adminSort: "Sort",
  adminSortNewest: "Newest update",
  adminSortOldest: "Oldest update",
  adminSortName: "Alphabetical name",
  adminFilterAction: "Apply filters",
  adminEdit: "Edit",
  adminPreview: "Preview",
  adminSaveDraft: "Save draft",
  adminSendReview: "Send to review",
  adminPublish: "Publish",
  adminArchive: "Archive",
  adminRestore: "Return to review",
  adminPersonNew: "Add new person",
  adminPersonEdit: "Edit person",
  adminBasicInformation: "Basic information",
  adminArabicName: "Arabic name",
  adminEnglishName: "English name",
  adminSlug: "Public slug",
  adminShortBio: "Short biography",
  adminBiography: "Structured biography",
  adminBirthDate: "Birth date",
  adminDeathDate: "Death date",
  adminBirthPlace: "Birth place",
  adminDeathPlace: "Death place",
  adminImageUrl: "Image URL",
  adminImageUrlHint: "Use an HTTPS public URL only for a real, licensed image source. Editorial-person uploads require media-provider configuration and dedicated persistence.",
  adminOccupations: "Occupations, comma-separated",
  adminOccupationsHint: "Enter one occupation per line or separate them with commas.",
  adminCategories: "Categories",
  adminCategoryCreateTitle: "Add category",
  adminCategoryEditTitle: "Edit category",
  adminCategoryName: "Category name",
  adminCategoryDescription: "Category description",
  adminCategoryPublicNote: "New categories are saved as published so they appear on the public site and person forms.",
  adminCreateCategory: "Create category",
  adminUpdateCategory: "Save changes",
  adminCategorySaved: "Category saved.",
  adminNoCategories: "No categories yet.",
  adminManageCategories: "Manage categories",
  adminNotFound: "The requested record was not found.",
  adminSources: "Sources",
  adminAddSource: "Add source",
  adminSourceTitle: "Source title",
  adminPublisher: "Publisher",
  adminSourceUrl: "Source URL",
  adminPublicationDate: "Publication date",
  adminAccessedAt: "Access date",
  adminSourceType: "Source type",
  adminReliability: "Reliability",
  adminReliabilityHigh: "High",
  adminReliabilityMedium: "Medium",
  adminReliabilityLow: "Low",
  adminTimeline: "Timeline",
  adminAddEvent: "Add event",
  adminEventDate: "Event date",
  adminEventTitle: "Event title",
  adminEventDescription: "Event description",
  adminEducation: "Education",
  adminAddEducation: "Add education",
  adminInstitution: "Institution",
  adminField: "Field or program",
  adminDateRange: "Date range",
  adminDescription: "Description",
  adminRemove: "Remove item",
  adminSave: "Save changes",
  adminSaving: "Saving…",
  adminSaved: "Saved",
  adminCancel: "Cancel",
  adminPreviewTitle: "Editorial preview",
  adminPreviewDescription: "This preview is protected and is not public before publication.",
  adminBackToEdit: "Back to editing",
  adminDatabaseError: "The database is unavailable right now.",
  adminValidationError: "Review required fields and invalid values.",
  adminReadinessTitle: "Record readiness",
  adminReadinessReady: "Ready (READY)",
  adminReadinessIncomplete: "Needs completion (INCOMPLETE)",
  adminReadinessBlockedLabel: "Blocked (BLOCKED)",
  adminReadinessPublishHint: "To publish: complete the name, slug, category, biography, and at least one source.",
  adminReadinessBlocked: "This status cannot continue until the readiness items above are complete.",
  adminUnauthorized: "You are not authorized to access this space.",
  adminStatusLabel: "Publication status",
  adminStatusTransitionError: "This editorial transition is not allowed.",
  adminConflictError: "The record conflicts with an existing record or current operation.",
  adminSelectPlaceholder: "Select…",
  adminNoSources: "Add at least one source before publishing.",
  adminNoTimeline: "No events added.",
  adminNoEducation: "No education records added.",
  adminPagePrevious: "Previous",
  adminPageNext: "Next",
  adminUpdated: "Updated",
  adminCreated: "Created",
  adminCredentialBoundary: "Passwords, hashes, and session tokens are never exposed in the Admin console.",
  adminCredentialLifecycleDeferred: "Activation and reset operations remain unavailable until a secure credential lifecycle and approved email provider are configured.",
  adminOpaqueSessionId: "Opaque session ID",
  adminControlCenter: "Control center",
  adminControlCenterDescription: "A unified operational space for content, professional profiles, and safe product controls.",
  adminLaunchControl: "Launch and operations control",
  adminLaunchControlDescription: "A read-only view of system state and operational readiness without automatic changes.",
  adminLaunchReadOnly: "Read-only; no migration, upload, delete, provisioning, or deployment actions are available.",
  adminLaunchStatus: "Status",
  adminLaunchDomainLabel: "Domain",
  adminLaunchMode: "Verification mode",
  adminLaunchDomainCountSuffix: "domains",
  adminLaunchEvidence: "Evidence",
  adminLaunchOwner: "Owner / next step",
  adminLaunchModeAutomatic: "Automatic",
  adminLaunchModeManual: "Manual review",
  adminLaunchModeExternal: "External environment",
  adminLaunchReady: "Ready",
  adminLaunchReadyWithLimitations: "Ready with limitations",
  adminLaunchRequiresConfiguration: "Requires configuration",
  adminLaunchNotTested: "Not tested",
  adminLaunchBlocked: "Blocked",
  adminLaunchNotApplicable: "Not applicable",
  adminLaunchApplication: "Application",
  adminLaunchDatabase: "Database",
  adminLaunchMigrations: "Migrations",
  adminLaunchAuthentication: "Authentication",
  adminLaunchRbac: "RBAC",
  adminLaunchEditorial: "Editorial content",
  adminLaunchMedia: "Media",
  adminLaunchSeo: "SEO and metadata",
  adminLaunchSiteExperience: "Site experience",
  adminLaunchOperations: "Operations",
  adminLaunchPortability: "Portability",
  adminLaunchAndroid: "Android",
  adminLaunchDomain: "Domain and DNS",
  adminLaunchPeopleReadiness: "People readiness",
  adminLaunchRequiredFields: "Required fields",
  adminLaunchRecommendedFields: "Recommended fields",
  adminLaunchSources: "Sources",
  adminLaunchPortrait: "Portrait",
  adminLaunchOpen: "Open",
  adminLaunchChecklist: "Operational checklist",
  adminLaunchNoData: "Sufficient data is not available for this domain yet.",
  adminLaunchLoading: "Reading operational state…",
  adminLaunchError: "Launch Control could not read the current state. No mutation was performed.",
  adminLaunchNoMutation: "No mutation was performed from this page.",
  adminLaunchEvidenceApplication: "The current application is serving; full build and deployment verification is external evidence.",
  adminLaunchEvidenceDeployment: "The deployment was verified externally without changing Vercel settings.",
  adminLaunchEvidenceProtected: "This route is protected server-side by system.read.",
  adminLaunchEvidenceMigration: "Expected, applied, and pending migrations are read from the current registry.",
  adminLaunchEvidenceMigrationAction: "Any pending migration requires a separate explicit procedure; nothing runs here.",
  adminLaunchEvidenceAuthentication: "Current Admin authentication state is derived from the health read model.",
  adminLaunchEvidenceRbac: "Server-side authorization uses the existing RBAC registry.",
  adminLaunchEvidenceEditorial: "A bounded sample is evaluated by the deterministic Editorial Quality Gate.",
  adminLaunchEvidenceMedia: "Provider, metadata, upload, and public-delivery states come from current Media health.",
  adminLaunchEvidenceSeo: "Canonical, metadata, sitemap, robots, and JSON-LD surfaces exist; crawler verification is external.",
  adminLaunchEvidenceSiteExperience: "Draft, published, and site-experience state comes from System Health.",
  adminLaunchEvidenceOperations: "Backup and restore documentation exists; execution and drills are external.",
  adminLaunchEvidencePortability: "Environment, Docker, and self-hosting documentation exists; external verification is pending.",
  adminLaunchEvidenceAndroid: "Android foundation and documentation exist; SDK, build, and signing are not tested here.",
  adminLaunchEvidenceDomain: "Domain and DNS procedures are documented; no external changes were performed.",
  adminLaunchNextStep: "Next step",
  adminLaunchBackup: "Backup",
  adminLaunchRestore: "Restore",
  adminLaunchMonitoring: "Monitoring",
  adminLaunchEmail: "Email",
  adminLaunchDocker: "Docker",
  adminLaunchCustomDomain: "Custom domain",
  adminLaunchBuild: "Build version",
  adminLaunchHealth: "Health endpoint",
  adminLaunchPublicRoutes: "Public routes",
  adminPeopleGroup: "Editorial content",
  adminOperationsGroup: "Operations and review",
  adminProductGroup: "Product controls",
  adminSystemGroup: "System",
  adminUsers: "Users",
  adminProfiles: "Professional profiles",
  adminAdministrators: "Administrators",
  adminEditors: "Editors",
  adminContent: "All content",
  adminHomepage: "Homepage",
  adminAppearance: "Appearance",
  adminMedia: "Media and files",
  adminSeo: "SEO",
  adminAudit: "Audit log",
  adminSystem: "System status",
  adminSettings: "Settings",
  adminSiteExperienceDescription: "Safely manage site experience settings with separate draft and published versions.",
  adminSiteExperienceCenter: "Site experience",
  adminSiteExperienceCenterDescription: "A unified center for identity, homepage, navigation, footer, appearance, SEO, and profile presentation.",
  adminPublishDraft: "Publish draft",
  adminDraftVersion: "Current draft",
  adminPublishedVersion: "Published version",
  adminLastSaved: "Last saved",
  adminIdentitySettings: "Site identity",
  adminThemeSettings: "Appearance settings",
  adminHomepageBuilder: "Homepage builder",
  adminNavigationManager: "Navigation manager",
  adminFooterManager: "Footer manager",
  adminSeoManager: "SEO manager",
  adminProfilePresentationSettings: "Professional profile presentation",
  adminSystemHealth: "System health",
  adminRecentActivity: "Recent activity",
  adminModerationQueue: "Moderation queue",
  adminQuickActions: "Quick actions",
  adminMediaProvider: "Media provider",
  adminRequiresConfiguration: "Requires configuration",
  adminVisible: "Visible",
  adminHidden: "Hidden",
  adminLabel: "Label",
  adminUrl: "URL",
  adminExternalLink: "External link",
  adminSectionTitle: "Section title",
  adminSectionDescription: "Section description",
  adminPublishConfirmation: "This version becomes public after publishing.",
  adminPublishSuccess: "Version published successfully.",
  adminDraftSaved: "Draft saved.",
  adminMoveUp: "Move up",
  adminMoveDown: "Move down",
  adminSiteName: "Site name",
  adminTagline: "Tagline",
  adminDefaultLanguage: "Default language",
  adminDirection: "Direction",
  adminSupportEmail: "Support email",
  adminContactEmail: "Contact email",
  adminLogo: "Logo",
  adminFavicon: "Favicon",
  adminShortName: "Short name",
  adminBrandDescription: "Brand description",
  adminTheme: "Theme",
  adminTypography: "Typography",
  adminSpacing: "Spacing",
  adminRadius: "Corner radius",
  adminNavigationStyle: "Navigation style",
  adminCardStyle: "Card style",
  adminButtonStyle: "Button style",
  adminHeroStyle: "Hero style",
  adminFooterStyle: "Footer style",
  adminHero: "Hero",
  adminSearchSection: "Search section",
  adminFeaturedSection: "Featured content",
  adminProfilesSection: "Professional profiles",
  adminCategoriesSection: "Categories",
  adminAboutSection: "About A3LAM",
  adminFinalCta: "Final CTA",
  adminSelectionMode: "Selection mode",
  adminItemLimit: "Item limit",
  adminDisplayMode: "Display mode",
  adminHelperText: "Helper text",
  adminSeoTitle: "SEO title",
  adminDefaultDescription: "Default description",
  adminKeywords: "Keywords",
  adminOgImage: "Social image",
  adminTwitterCard: "X/Twitter card",
  adminCanonicalBase: "Canonical base",
  adminIndexingAllowed: "Allow indexing",
  adminTemplate: "Template",
  adminSectionOrder: "Section order",
  adminShowPortfolio: "Show portfolio",
  adminShowContact: "Show contact CTA",
  adminShowSocial: "Show social links",
  adminShowPrint: "Show print control",
  adminShowShare: "Show share controls",
  adminPrimary: "Primary action",
  adminSecondary: "Secondary action",
  adminCopyright: "Copyright",
  adminLegalLinks: "Legal links",
  adminTokenPrimary: "Primary color",
  adminTokenAccent: "Accent color",
  adminTokenSurface: "Surface color",
  adminTokenDensity: "Display density",
  adminTokenContainer: "Container width",
  adminAddLink: "Add link",
  adminAddGroup: "Add group",
  adminAddSocialLink: "Add social link",
  adminMediaSafetyNote: "Only metadata is retained through an external storage provider; there is no filesystem or PostgreSQL-bytes fallback.",
  adminMediaLibrary: "Media library",
  adminMediaUpload: "Upload primary portrait",
  adminMediaSelect: "Choose a file",
  adminMediaCurrentPortrait: "Current primary portrait",
  adminMediaAltText: "Alt text",
  adminMediaSource: "Image source",
  adminMediaAttribution: "Attribution",
  adminMediaLicense: "License or rights",
  adminMediaVisibility: "Public visibility",
  adminMediaPublic: "Public",
  adminMediaPrivate: "Private",
  adminMediaSaveMetadata: "Save media metadata",
  adminMediaDetach: "Detach",
  adminMediaArchive: "Archive asset",
  adminMediaNoAssets: "There are no media assets in the current scope.",
  adminMediaNoProvider: "Media upload is disabled until a storage provider is configured.",
  adminMediaRequiresPersonId: "Save the person before uploading a portrait.",
  adminMediaPendingMigration: "The Media schema requires migration 0007 in this environment.",
  adminUnavailableTitle: "This function is not enabled yet",
  adminUnavailableDescription: "This area requires a data structure or external configuration that is not available in the current release.",
  adminRequiresSchema: "Requires schema configuration",
  adminRequiresMigration: "Requires pending migrations",
  adminReadOnly: "Read-only",
  adminDatabaseStatus: "Database status",
  adminAuthStatus: "Admin protection",
  adminMigrationStatus: "Migration status",
  adminSiteExperienceStatus: "Site Experience settings",
  adminAppliedMigrations: "Applied migrations",
  adminPendingMigrations: "Pending migrations",
  adminExpectedMigrations: "Expected migrations",
  adminMigrationRegistryTitle: "Migration registry",
  adminMigrationRegistryDescription: "Database schema status compared with the project migration files.",
  adminMigrationVersion: "Migration",
  adminMigrationRowStatus: "Status",
  adminMigrationAppliedAt: "Applied at",
  adminMigrationApplied: "Applied",
  adminMigrationPending: "Pending",
  adminMigrationUnexpected: "Unexpected",
  adminMigrationInconsistent: "Inconsistent",
  adminMigrationUnavailable: "Unavailable",
  adminMigrationRegistryHealthy: "Migration registry is consistent",
  adminMigrationRegistryPending: "Pending migrations exist",
  adminMigrationRegistryInconsistent: "Migration registry is inconsistent",
  adminMigrationRegistryUnavailable: "The migration registry could not be read.",
  adminMigrationNoAppliedAt: "—",
  adminMigrationControlTitle: "Migration control",
  adminMigrationControlDescription: "Run one migration only after server-side preflight, using the approved runner.",
  adminMigrationPreflight: "Preflight",
  adminMigrationPrerequisites: "Prerequisites",
  adminMigrationNext: "Next migration",
  adminMigrationAuthorization: "Authorization",
  adminMigrationExecution: "Execution",
  adminMigrationDatabase: "Database",
  adminMigrationRegistry: "Registry",
  adminMigrationAuthorized: "Authorized",
  adminMigrationNotAuthorized: "Not authorized",
  adminMigrationReady: "Ready to execute",
  adminMigrationBlocked: "Execution blocked",
  adminMigrationPrerequisiteMissing: "Execution is blocked until prerequisites are complete.",
  adminMigrationNoPending: "No pending migrations.",
  adminMigrationExecuteButton: "Run next migration",
  adminMigrationConfirmPrompt: "I confirm running only the next migration",
  adminMigrationSuccess: "The next migration was executed and recorded.",
  adminMigrationFailure: "The migration could not be executed. Execution stopped.",
  adminMigrationStopped: "The change was not committed.",
  adminPublishedResources: "Published resources",
  adminDraftResources: "Draft resources",
  adminAvailable: "Available",
  adminUnavailable: "Unavailable",
  adminNoUsers: "There are no user accounts in the current scope.",
  adminPeopleRelated: "Related people",
  adminProfilesRelated: "Related profiles",
  adminIdentityStatus: "Identity status",
  adminStatusInvited: "Invited — activation required",
  adminStatusActive: "Active",
  adminStatusDisabled: "Disabled",
  adminRole: "Role",
  adminRoleSuperAdmin: "Super Admin",
  adminRoleAdmin: "Admin",
  adminRoleEditor: "Editor",
  adminRoleModerator: "Moderator",
  adminCreateIdentity: "Add admin identity",
  adminIdentityName: "Display name",
  adminIdentityEmail: "Admin email",
  adminIdentityRequiresActivation: "No invitation or credential activation flow is enabled in Phase 17.1; the identity will remain invited.",
  adminChangeRole: "Change role",
  adminDisable: "Disable",
  adminEnable: "Enable",
  adminSessions: "Sessions",
  adminRevoke: "Revoke",
  adminNoSessions: "There are no active Admin sessions.",
  adminSessionExpires: "Expires",
  adminSessionDevice: "Device",
  adminSessionAddress: "Network address",
  adminRevokeUserSessions: "Revoke user sessions",
  adminUserStatus: "Account status",
  adminUserActive: "Active",
  adminUserDisabled: "Disabled",
  adminNoAdminIdentities: "There are no Admin identities in the current scope.",
  adminNoEditors: "There are no Editor identities in the current scope.",
  adminPermissionMatrix: "Permission matrix",
  adminPermissionMatrixDescription: "Reference for the current centralized policy; edit checkboxes are not shown before persisted permission assignment is available.",
  adminPermissionRole: "Role",
  adminPermissionCode: "Permission",
  adminUserDetail: "User detail",
  adminAccountOverview: "Account overview",
  adminProfileOverview: "Professional profile",
  adminSecurity: "Security",
  adminCompletion: "Profile completion",
  adminActiveSessions: "Active sessions",
  adminAuditEvents: "Audit events",
  adminView: "View",
  adminRevokeAllSessions: "Revoke all sessions",
  adminSuspendUser: "Disable account",
  adminReactivateUser: "Reactivate account",
  adminPermissionOverrides: "Permission overrides",
  adminDefaultPermissions: "Default permissions",
  adminEffectivePermissions: "Effective permissions",
  adminPermissionAllow: "Allow",
  adminPermissionDeny: "Deny",
  adminSavePermissions: "Save permissions",
  adminPermissionSaved: "Permissions saved.",
  adminPermissionConfiguration: "Permission management requires migration 0005 and secure configuration; editing is unavailable in this environment.",
  adminConfirmationNeeded: "Confirm this sensitive operation before continuing.",
  adminAuditFilters: "Filter audit log",
  adminAuditActor: "Actor",
  adminAuditAction: "Action",
  adminAuditEntity: "Entity",
  adminAuditFrom: "From date",
  adminAuditTo: "To date",
  adminClearFilters: "Clear filters",
  adminNoAudit: "No audit events match the current scope.",
  adminSessionStatus: "Session status",
  adminCurrentSession: "Current session",
  adminSessionActive: "Active",
  adminSessionRevoked: "Revoked",
  adminSessionExpired: "Expired",
  adminAllSessions: "All sessions",
  adminProfileStatus: "Profile status",
  adminVisibility: "Visibility",
  adminVisibilityPrivate: "Private",
  adminVisibilityUnlisted: "Unlisted",
  adminVisibilityPublished: "Public",
  adminHasProfile: "Professional profile",
  adminWithProfile: "Has profile",
  adminWithoutProfile: "No profile",
  adminCompletionShort: "Completion",
  adminAi: "A3LAM AI",
  adminAiActivation: "Production processing activation",
  adminAiActivationDisabled: "AI Production Processing is disabled.",
  adminAiActivationEnabled: "Enabled",
  adminAiDescription: "Smart profile builder — a safe foundation for extracting and human-reviewing document information.",
  adminAiProvider: "AI provider",
  adminAiDocumentProcessing: "Document processing",
  adminAiPrivacyNotice: "Documents are private by default; they are not published or exposed in search, sitemaps, or public metadata.",
  adminAiCreateFromDocument: "Create a profile from a document",
  adminAiConfigurationRequired: "This feature requires configuration; the AI provider and complete storage/processing path are not configured.",
  adminAiDocuments: "Documents",
  adminAiProcessing: "Processing",
  adminAiCompleted: "Completed",
  adminAiFailed: "Failed",
  adminAiReviewRequired: "Review required",
  adminAiNoDocuments: "No data yet.",
  adminAiUploadHint: "The future contract supports PDF, DOCX, and TXT. Production upload is disabled until storage and processing are configured.",
  adminAiSupportedTypes: "Contract-supported types",
  adminAiHumanReview: "Human review",
  adminAiDraftBoundary: "Future output enters as a draft and cannot move automatically to publication.",
  adminAiNoInference: "No inference or AI provider call was executed in this phase.",
  adminAiNoPersistence: "AI job persistence is not initialized; synthetic counters are not shown.",
  adminAiRequiresMigration: "Persistence requires an additive migration that is not applied in Production.",
  adminAiQueue: "Processing queue",
  adminAiMalwareScanning: "Malware scanning",
  adminAiRetention: "Retention policy",
  adminAiDocumentStatus: "Document status",
  adminAiNoDocumentSelected: "Select a document to review its private details.",
  adminAiReviewStart: "Start human review",
  adminAiReviewUnavailable: "Review data is unavailable until the required migration is applied.",
  adminAiExtractedText: "Private extracted text",
  adminAiNoExtractedText: "No extracted text is available for review.",
  adminAiRetry: "Retry",
  adminAiUploadProgress: "Operation progress",
  adminAiUnsupportedType: "Unsupported file type. Use PDF, DOCX, or TXT.",
  adminAiInvalidSize: "The file size is not allowed.",
  adminAiRemoveSelection: "Remove selection",
  adminAiStructuredFields: "Identity · Professional · Education · Career · Achievements · Awards · Publications · Skills · Languages · Links · Sources",
  adminAiExtractionCapability: "Extraction capability",
  adminAiParserStatus: "Parser status",
  adminAiLimits: "Safety limits: 10MB file · 8MB text · 100 PDF pages · 5,000 paragraphs · 500 table cells · 200 DOCX entries",
  adminAiParserAvailable: "Available for isolated local testing only",
  adminAiParserUnavailable: "Currently unavailable",
  adminAiReviewField: "Field",
  adminAiReviewValue: "Suggested value",
  adminAiReviewSource: "Source / evidence",
  adminAiReviewConfidence: "Confidence",
  adminAiReviewClassification: "Classification",
  adminAiReviewAction: "Action",
  adminAiAccept: "Accept",
  adminAiEdit: "Edit and accept",
  adminAiReject: "Reject",
  adminAiReviewSaving: "Saving review decision…",
  adminAiReviewError: "The review decision could not be saved.",
  adminAiReviewNote: "Reviewer note",
  adminAiNoFacts: "No extracted information is available for review yet.",
  adminAiGeneration: "Structured generation",
  adminAiGenerationProvider: "Generation provider status",
  adminAiGenerationModes: "Modes: Professional CV · Professional profile · A3LAM Person draft · Biography · SEO draft",
  adminAiOutputLanguages: "Output languages: Arabic · English · Bilingual · Source language",
  adminAiGenerationDisabled: "Generation is disabled until an approved provider and private persistence are configured.",
  adminAiGenerationDraft: "Every generated output remains a DRAFT and is never published automatically.",
  adminAiGenerationQuality: "Output quality gate",
  adminAiGenerationClaims: "Generated claims",
  adminAiGenerationNoClaims: "No generated claims are available for review.",
  adminAiGenerationReview: "Claim review: source → fact → interpretation → claim → decision",
  adminAiRequestSource: "Request source",
  adminAiConflict: "Conflicted; human review required",
  adminAiPipeline: "Processing pipeline",
  adminAiPipelineUploaded: "Uploaded",
  adminAiPipelineExtracted: "Extracted",
  adminAiPipelineFacts: "Facts",
  adminAiPipelineGeneration: "Generation",
  adminAiPipelineReview: "Review",
  adminAiPipelineApproved: "Approved as draft",
  adminAiGenerationStatus: "Generation status",
  adminAiQualityGate: "Quality gate",
  adminAiBack: "Back",
  adminAiLocalOnly: "Local only",
  adminAiChooseLocalFile: "Choose local file",
  adminAiOcrNotice: "A PDF without a text layer requires OCR; OCR is not configured.",
  adminAiDocxNotice: "DOCX is bounded by archive, paragraph, and table limits; unsafe files are rejected.",
  adminAiSourceA: "Source A",
  adminAiSourceB: "Source B",
  adminAiBoundaryDraftPerson: "An AI draft is not a Person",
  adminAiBoundaryDraftProfile: "An AI draft is not a published Profile",
  adminAiBoundaryDraftPublished: "An AI draft is not published content",
  adminAiDraftStatus: "Draft / DRAFT",
  adminAiLanguageArabic: "Arabic",
  adminAiLanguageEnglish: "English",
  adminAiLanguageBilingual: "Bilingual",
  adminAiLanguageSource: "Source language",
  adminAiModeProfessionalCvDescription: "Organizes experience and education into a reviewable professional CV.",
  adminAiModeProfessionalProfileDescription: "Builds a concise, source-backed editorial professional profile.",
  adminAiModePersonDraftDescription: "A future A3LAM Person structure; it is not a Person or published Profile.",
  adminAiModeBiographyDescription: "Suggests a short biography while keeping every claim under review.",
  adminAiModeSeoDescription: "Creates editorial SEO fields without automatic publication.",
  adminAiEditedSuffix: "edited",
  adminAiWorkspaceTitle: "Editorial workspace",
  adminAiWorkspaceDescription: "A private, step-based workspace for understanding sources, reviewing facts, and building a draft before any later editorial decision.",
  adminAiStepDocument: "Document",
  adminAiStepExtraction: "Extraction",
  adminAiStepFacts: "Facts",
  adminAiStepGeneration: "Generation",
  adminAiStepDraft: "Draft",
  adminAiStepClaims: "Claims",
  adminAiStepReview: "Review",
  adminAiRunIsolatedDemo: "Run isolated demo",
  adminAiLocalDemoNotice: "This is a local isolated demo using synthetic data only. No file is uploaded and no Production record is created.",
  adminAiDropzoneHint: "Choose a PDF, DOCX, or TXT for local review; Production upload is disabled.",
  adminAiSelectedDocument: "Selected document",
  adminAiDetectedLanguage: "Detected language",
  adminAiProcessingState: "Processing state",
  adminAiSections: "Sections",
  adminAiParagraphs: "Paragraphs",
  adminAiOpenSource: "Open source",
  adminAiEvidenceUnavailable: "Evidence unavailable — verification required.",
  adminAiConflictDetected: "Conflict detected",
  adminAiNeedsHumanReview: "Needs human review",
  adminAiGenerationChooseMode: "Choose draft mode",
  adminAiGenerationChooseLanguage: "Choose output language",
  adminAiModeProfessionalCv: "Structured professional CV",
  adminAiModeProfessionalProfile: "Editorial professional profile",
  adminAiModePersonDraft: "Future A3LAM Person draft",
  adminAiModeBiography: "Short biography",
  adminAiModeSeo: "SEO draft",
  adminAiReadiness: "Production activation readiness",
  adminAiReadinessDescription: "A truthful dependency and gate matrix before any production activation.",
  adminAiReadinessStatus: "Status",
  adminAiReadinessReason: "Reason",
  adminAiReadinessEvidence: "Evidence",
  adminAiReadinessNextStep: "Required next step",
  adminAiReadinessOwner: "Owner",
  adminAiReadinessVerificationMethod: "Verification method",
  adminAiReadinessLayer: "Readiness layer",
  adminAiReadinessRisk: "Risk level",
  adminAiDecisionNotTested: "NOT TESTED",
  adminAiReadinessBlocker: "Activation blocker",
  adminAiReadinessNoBlocker: "No confirmed blocker",
  adminAiReadinessInfrastructure: "Infrastructure",
  adminAiReadinessApplication: "Application",
  adminAiReadinessSecurity: "Security",
  adminAiReadinessOperations: "Operations",
  adminAiReadinessMigration: "Migration registry",
  adminAiReadinessGate: "Feature gates",
  adminAiGateUpload: "Document upload",
  adminAiGateProcessing: "Processing",
  adminAiGateGeneration: "Generation",
  adminAiGateOcr: "OCR",
  adminAiGatePublication: "Publication",
  adminAiGateOff: "OFF / disabled",
  adminAiDecisionActivationReady: "ACTIVATION READY",
  adminAiDecisionActivationReadyWithLimitations: "ACTIVATION READY WITH LIMITATIONS",
  adminAiDecisionNotReady: "NOT READY",
  adminAiDecisionBlocked: "BLOCKED",
  adminAiReadinessAuthentication: "Authentication",
  adminAiReadinessCsrf: "CSRF / same-origin protection",
  adminAiReadinessDocumentIngestion: "Document ingestion",
  adminAiReadinessClaimsProvenance: "Claims and provenance",
  adminAiReadinessWorkflowStateMachine: "Workflow state machine",
  adminAiReadinessExternalQa: "External QA/accessibility",
  adminAiReadinessAiProvider: "AI provider",
  adminAiReadinessPrivateStorage: "Private storage",
  adminAiReadinessMalwareScanner: "Malware scanner",
  adminAiReadinessQueue: "Processing queue",
  adminAiReadinessWorker: "Worker",
  adminAiReadinessOcr: "OCR",
  adminAiReadinessPersistence: "Persistence",
  adminAiReadinessMigrations: "Migrations",
  adminAiReadinessRetention: "Retention and deletion",
  adminAiReadinessRateLimits: "Rate limits",
  adminAiReadinessCostControls: "Cost controls",
  adminAiReadinessObservability: "Observability",
  adminAiReadinessAudit: "Audit",
  adminAiReadinessRbac: "RBAC",
  adminAiReadinessPrivacy: "Privacy and public isolation",
  adminAiReadinessPromptBoundary: "Prompt and untrusted-data boundary",
  adminAiReadinessExtraction: "Extraction",
  adminAiReadinessGeneration: "Generation",
  adminAiReadinessHumanReview: "Human review",
  adminAiReadinessPublication: "Publication safety",
  adminAiReadinessPublicationGuard: "Publication Guard",
  adminAiReadinessRollback: "Rollback",
  adminAiRunGeneration: "Create local draft",
  adminAiSourceBacked: "Source-backed",
  adminAiNeedsVerification: "Needs verification",
  adminAiAiWording: "AI-generated wording needs review",
  adminAiFinalPrivateDraft: "Final private draft",
  adminAiPrivateDraftNotice: "This file is private and has not been published.",
  adminAiSourceFact: "Source fact",
  adminAiGeneratedClaim: "Generated claim",
  adminAiClaimAccept: "Accept",
  adminAiClaimEdit: "Edit and accept",
  adminAiClaimReject: "Reject",
  adminAiClaimRequestSource: "Request source",
  adminAiEditorialReadiness: "Editorial readiness",
  adminAiIdentityCheck: "Identity",
  adminAiSourcesCheck: "Sources",
  adminAiEvidenceCheck: "Evidence",
  adminAiConflictsCheck: "Conflicts",
  adminAiClaimsCheck: "Claims",
  adminAiCompletenessCheck: "Completeness",
  adminAiPrivacyCheck: "Privacy",
  adminAiPublicationCheck: "Publication",
  adminAiPass: "Pass",
  adminAiWarning: "Warning",
  adminAiBlocked: "Blocked",
  adminAiProductionDisabled: "AI Production Processing is disabled.",
  adminAiMockAvailable: "Mock AI is available for isolated testing only.",
  adminAiReviewRequiredBeforeProceed: "This step requires human review before proceeding.",
  adminAiNoLocalDraft: "No local draft yet.",
  adminAiDemoGenerated: "A local draft was created; it remains private and DRAFT.",
  adminAiWorkflowIntro: "Follow a clear path from source to a reviewable draft — with no automatic publication.",
  adminAiSandboxLabel: "SANDBOX · Synthetic data only",
  adminAiProgress: "Workflow progress",
  adminAiStepOf: "Step {current} of {total}",
  adminAiNextAction: "Next action",
  adminAiModeSelected: "Selected mode",
  adminAiLocalFileSelected: "A local file was selected. This demo does not upload or process it; use the isolated synthetic demo to continue.",
  adminAiOriginalValue: "Original value",
  adminAiReviewedValue: "Reviewed value",
  adminAiDecision: "Reviewer decision",
  adminAiSaveDraft: "Save as local draft",
  adminAiContinueReview: "Continue review",
  adminAiFinalBoundary: "Local save only · no Person/Profile creation · no publication",
  adminAiSourceCoverage: "Source coverage",
  adminAiUnresolved: "Unresolved",
  adminAiRejected: "Rejected",
  adminAiEdited: "Edited",
  adminAiReviewer: "Reviewer",
  adminAiUnsavedChanges: "You have unsaved local changes.",
  adminAiLocalStateAvailable: "A local workspace state was restored from this browser.",
  adminAiResumeLocal: "Continue restored state",
  adminAiDiscardLocal: "Discard local state",
  adminAiSavedLocally: "Saved locally in this browser only.",
  adminAiLocalSaveFailed: "This browser could not save the local workspace state.",

};

export const messages: Record<Locale, FoundationMessages> = { ar, en };

export function getMessages(locale: Locale): FoundationMessages {
  return messages[locale] ?? messages.ar;
}

export type PublicMessages = Omit<FoundationMessages, `admin${string}`>;

export function getPublicMessages(locale: Locale): PublicMessages {
  const full = getMessages(locale);
  return Object.fromEntries(Object.entries(full).filter(([key]) => !key.startsWith("admin"))) as PublicMessages;
}
