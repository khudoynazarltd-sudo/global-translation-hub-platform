"use client";

export default function ConfirmDeleteEnquiry({
  enquiryId,
}: {
  enquiryId: string;
}) {
  return (
    <form
      action={`/api/admin/enquiries/${enquiryId}/lifecycle`}
      method="post"
      onSubmit={(event) => {
        const confirmed =
          window.confirm(
            "Are you sure you want to permanently delete this enquiry and all of its temporary documents? This action cannot be undone."
          );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="action"
        value="delete"
      />

      <button
        type="submit"
        className="rounded-xl bg-[#b42318] px-5 py-3 font-semibold text-white"
      >
        Delete Enquiry
      </button>
    </form>
  );
}