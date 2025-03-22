document.addEventListener("DOMContentLoaded", () => {
  // Base payment amount
  const basePayment = 511.67

  // Feature prices (monthly)
  const featurePrices = {
    arc: 25.0,
    gap: 15.0,
    glasscoat: 12.0,
    qualityguard: 18.0,
    tirewheel: 14.0,
  }

  // Default configuration
  const defaultConfig = {
    platinum: ["arc", "gap", "glasscoat", "qualityguard", "tirewheel"],
    gold: ["arc", "gap", "glasscoat", "qualityguard"],
    silver: ["arc", "gap", "glasscoat"],
    bronze: ["arc", "gap"],
  }

  // Current configuration (will be updated as items are moved)
  let currentConfig = JSON.parse(JSON.stringify(defaultConfig))

  // Initialize Sortable for each column
  const columns = ["platinum", "gold", "silver", "bronze"]
  const sortables = {}

  columns.forEach((column) => {
    sortables[column] = new Sortable(document.getElementById(`${column}-items`), {
      group: "protection-features",
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onEnd: (evt) => {
        // Update the item's color class to match its new column
        const item = evt.item
        const newColumn = evt.to.id.split("-")[0] // Extract column name from id

        // Remove old color classes
        item.classList.remove("platinum-color", "gold-color", "silver-color", "bronze-color")

        // Add new color class
        item.classList.add(`${newColumn}-color`)

        // Add highlight animation
        item.classList.add("highlight-animation")
        setTimeout(() => {
          item.classList.remove("highlight-animation")
        }, 1000)

        // Update current configuration
        updateCurrentConfig()

        // Update payment amounts
        updatePayments()
      },
    })
  })

  // Function to update current configuration based on DOM
  function updateCurrentConfig() {
    // Reset current config
    currentConfig = {
      platinum: [],
      gold: [],
      silver: [],
      bronze: [],
    }

    // Update based on current DOM state
    columns.forEach((column) => {
      const items = document.querySelectorAll(`#${column}-items .kanban-item`)
      items.forEach((item) => {
        const feature = item.getAttribute("data-feature")
        currentConfig[column].push(feature)
      })
    })
  }

  // Function to calculate payment for a column
  function calculatePayment(column) {
    let payment = basePayment

    // Add feature prices
    currentConfig[column].forEach((feature) => {
      if (featurePrices[feature]) {
        payment += featurePrices[feature]
      }
    })

    return payment.toFixed(2)
  }

  // Function to update payment displays with animation
  function updatePayments() {
    columns.forEach((column) => {
      const payment = calculatePayment(column)

      // Update payment in header
      const headerPaymentEl = document.getElementById(`${column}-payment`)
      animatePaymentChange(headerPaymentEl, payment)

      // Update payment at bottom
      const bottomPaymentEl = document.getElementById(`${column}-payment-bottom`)
      if (bottomPaymentEl) {
        animatePaymentChange(bottomPaymentEl, payment)
      }

      // Also update modal values if they exist
      const modalPaymentEl = document.getElementById(`modal-${column}-payment`)
      if (modalPaymentEl) {
        modalPaymentEl.textContent = `$${payment}`
      }
    })
  }

  // Function to animate payment changes
  function animatePaymentChange(element, newValue) {
    if (!element) return

    // Add highlight class
    element.classList.add("payment-highlight")

    // Update the value
    element.textContent = `$${newValue}`

    // Remove highlight class after animation completes
    setTimeout(() => {
      element.classList.remove("payment-highlight")
    }, 700)
  }

  // Save button click handler with improved feedback
  const saveButton = document.getElementById("save-button")
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      // Add loading state to button
      saveButton.disabled = true
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...'

      // Simulate a short delay for better UX
      setTimeout(() => {
        // Update modal values
        columns.forEach((column) => {
          const payment = calculatePayment(column)
          const modalPaymentEl = document.getElementById(`modal-${column}-payment`)
          if (modalPaymentEl) {
            modalPaymentEl.textContent = `$${payment}`
          }
        })

        // Reset button state
        saveButton.disabled = false
        saveButton.innerHTML = '<i class="fas fa-save me-2"></i>Save Configuration'

        // Show modal
        const saveModal = new bootstrap.Modal(document.getElementById("saveModal"))
        saveModal.show()
      }, 600)
    })
  }

  // Reset button click handler with improved confirmation
  const resetButton = document.getElementById("reset-button")
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Create a custom confirmation dialog
      const confirmDialog = document.createElement("div")
      confirmDialog.className = "modal fade"
      confirmDialog.id = "resetConfirmModal"
      confirmDialog.setAttribute("tabindex", "-1")
      confirmDialog.setAttribute("aria-hidden", "true")

      confirmDialog.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Reset</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to reset to the default configuration? All your changes will be lost.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmResetBtn">
                <i class="fas fa-undo me-2"></i>Reset
              </button>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(confirmDialog)

      const resetModal = new bootstrap.Modal(document.getElementById("resetConfirmModal"))
      resetModal.show()

      // Handle confirm button click
      document.getElementById("confirmResetBtn").addEventListener("click", () => {
        resetModal.hide()
        resetToDefault()

        // Show success toast
        showToast("Configuration Reset", "Your protection plan has been reset to default.", "info")

        // Remove the modal from DOM after hiding
        document.getElementById("resetConfirmModal").addEventListener("hidden.bs.modal", () => {
          document.body.removeChild(confirmDialog)
        })
      })

      // Remove the modal from DOM if canceled
      document.getElementById("resetConfirmModal").addEventListener("hidden.bs.modal", () => {
        document.body.removeChild(confirmDialog)
      })
    })
  }

  // Function to show toast notifications
  function showToast(title, message, type = "success") {
    const toastContainer = document.createElement("div")
    toastContainer.className = "position-fixed bottom-0 end-0 p-3"
    toastContainer.style.zIndex = "1080"

    const bgClass =
      type === "success" ? "bg-success" : type === "info" ? "bg-info" : type === "warning" ? "bg-warning" : "bg-danger"

    const iconClass =
      type === "success"
        ? "fa-check-circle"
        : type === "info"
          ? "fa-info-circle"
          : type === "warning"
            ? "fa-exclamation-triangle"
            : "fa-times-circle"

    toastContainer.innerHTML = `
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header ${bgClass} text-white">
          <i class="fas ${iconClass} me-2"></i>
          <strong class="me-auto">${title}</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `

    document.body.appendChild(toastContainer)

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toastContainer.querySelector(".toast").classList.remove("show")
      setTimeout(() => {
        document.body.removeChild(toastContainer)
      }, 300)
    }, 3000)

    // Handle manual close
    toastContainer.querySelector(".btn-close").addEventListener("click", () => {
      toastContainer.querySelector(".toast").classList.remove("show")
      setTimeout(() => {
        document.body.removeChild(toastContainer)
      }, 300)
    })
  }

  // Function to reset to default configuration
  function resetToDefault() {
    // Add loading state to reset button
    if (resetButton) {
      resetButton.disabled = true
      resetButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Resetting...'
    }

    // Clear all columns
    columns.forEach((column) => {
      document.getElementById(`${column}-items`).innerHTML = ""
    })

    // Recreate default items in each column
    recreateItems()

    // Update current configuration
    currentConfig = JSON.parse(JSON.stringify(defaultConfig))

    // Update payment amounts
    updatePayments()

    // Reset button state after a short delay
    setTimeout(() => {
      if (resetButton) {
        resetButton.disabled = false
        resetButton.innerHTML = '<i class="fas fa-undo me-2"></i>Reset to Default'
      }
    }, 600)
  }

  // Function to recreate items based on default configuration
  function recreateItems() {
    // Template for each feature
    const templates = {
      arc: `
        <div class="kanban-item {color}" data-feature="arc" data-price="25.00">
          <div class="item-header">ARC / Exclusionary</div>
          <div class="item-details">60 mo. / 60,000 miles</div>
          <div class="item-details">$100.00 Disappearing Deductible</div>
          <div class="item-description">
            Pays 100% of covered Labor and Parts. Includes Towing, Rental and Roadside Assistance. Comprehensive mechanical & electrical breakdown coverage
          </div>
        </div>
      `,
      gap: `
        <div class="kanban-item {color}" data-feature="gap" data-price="15.00">
          <div class="item-header">FP20010811 (GAP 150)</div>
          <div class="item-details">120 mo.</div>
          <div class="item-description">
            Picks up where the insurance company leaves off. In the event your vehicle is totaled or stolen and unrecovered, GAP pays the difference of your payoff and the insurance
          </div>
        </div>
      `,
      glasscoat: `
        <div class="kanban-item {color}" data-feature="glasscoat" data-price="12.00">
          <div class="item-header">GlassCoat Lifetime New</div>
          <div class="item-details">120 mo. / 999,999 miles</div>
          <div class="item-description">
            Exterior Protection. Protects against weather-induced fading and loss of gloss, damage from acid rain, bird droppings & tree sap, industrial fallout
          </div>
        </div>
      `,
      qualityguard: `
        <div class="kanban-item {color}" data-feature="qualityguard" data-price="18.00">
          <div class="item-header">QualityGuard+Plus Maint $30-3/3,750</div>
          <div class="item-details">96 mo. / 120,000 miles</div>
          <div class="item-description">
            Ensures proper maintenance on your vehicle and offers convenience and exceptional value. Prepays your vehicle's service visits to ensure proper maintenance
          </div>
        </div>
      `,
      tirewheel: `
        <div class="kanban-item {color}" data-feature="tirewheel" data-price="14.00">
          <div class="item-header">Tire & Wheel - New</div>
          <div class="item-details">84 mo. / 999,999 miles</div>
          <div class="item-description">
            Protection from all road hazards. Repair or replace all tires and wheels and charges associated with the repair or replacement.
          </div>
        </div>
      `,
    }

    // Add items to each column based on default config
    columns.forEach((column) => {
      const columnEl = document.getElementById(`${column}-items`)

      defaultConfig[column].forEach((feature) => {
        if (templates[feature]) {
          const html = templates[feature].replace("{color}", `${column}-color`)
          columnEl.insertAdjacentHTML("beforeend", html)
        }
      })
    })
  }

  // Add hover effects to payment info boxes
  document.querySelectorAll(".payment-info-bottom").forEach((box) => {
    box.addEventListener("mouseenter", () => {
      box.style.transform = "translateY(-3px)"
      box.style.boxShadow = "0 6px 15px rgba(0, 0, 0, 0.1)"
    })

    box.addEventListener("mouseleave", () => {
      box.style.transform = ""
      box.style.boxShadow = ""
    })
  })

  // Add CSS for payment highlight animation
  const style = document.createElement("style")
  style.textContent = `
    @keyframes paymentHighlight {
      0% { color: #2563eb; transform: scale(1.1); }
      100% { color: #0f172a; transform: scale(1); }
    }
    
    .payment-highlight {
      animation: paymentHighlight 0.7s ease-out;
    }
  `
  document.head.appendChild(style)

  // Initial payment update
  updatePayments()
})

