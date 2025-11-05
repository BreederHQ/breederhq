              <div className="min-w-0">
                <SectionCard title="ACTUAL DATES">
                  {isEdit && !isCommitted && (
                    <div className="text-xs text-[hsl(var(--brand-orange))] mb-2">
                      Commit the plan to enable Actual Dates.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-xs text-secondary mb-1">CYCLE START (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.cycleStartDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ cycleStartDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">HORMONE TESTING START (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.hormoneTestingStartDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ hormoneTestingStartDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">BREEDING DATE (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.breedDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ breedDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">BIRTHED DATE (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.birthDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ birthDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">WEANED DATE (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.weanedDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ weanedDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">PLACEMENT START (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.placementStartDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ placementStartDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">PLACEMENT COMPLETED (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.placementCompletedDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ placementCompletedDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    <div>
                      <div className="text-xs text-secondary mb-1">PLAN COMPLETED (ACTUAL)</div>
                      <CalendarInput
                        defaultValue={row.completedDateActual ?? ""}
                        readOnly={!canEditDates}
                        onChange={(e) => canEditDates && setDraftLive({ completedDateActual: e.currentTarget.value })}
                        className={dateFieldW}
                        inputClassName={dateInputCls}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    {isEdit && (
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          variant="outline"
                          disabled={!canEditDates}
                          onClick={() => {
                            if (!canEditDates) return;
                            if (
                              !window.confirm(
                                "Reset ALL actual date fields (Cycle Start, Hormone Testing Start, Breeding, Birthed, Weaned, Placement Start, Placement Completed, Plan Completed)?"
                              )
                            ) {
                              return;
                            }
                            setDraftLive({
                              cycleStartDateActual: null,
                              hormoneTestingStartDateActual: null,
                              breedDateActual: null,
                              birthDateActual: null,
                              weanedDateActual: null,
                              placementStartDateActual: null,
                              placementCompletedDateActual: null,
                              completedDateActual: null,
                            });
                          }}
                        >
                          Reset Dates
                        </Button>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
