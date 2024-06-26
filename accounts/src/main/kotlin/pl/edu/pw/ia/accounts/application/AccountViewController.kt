package pl.edu.pw.ia.accounts.application

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import java.util.UUID
import org.axonframework.extensions.reactor.queryhandling.gateway.ReactorQueryGateway
import org.axonframework.messaging.responsetypes.ResponseTypes
import org.springframework.http.MediaType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ServerWebExchange
import pl.edu.pw.ia.shared.application.exception.ApiErrorResponse
import pl.edu.pw.ia.shared.domain.exception.AccountNotFoundException
import pl.edu.pw.ia.shared.domain.exception.AccountWithUsernameNotFoundException
import pl.edu.pw.ia.shared.domain.query.FindAccountByIdQuery
import pl.edu.pw.ia.shared.domain.query.FindAccountByUsernameQuery
import pl.edu.pw.ia.shared.domain.view.AccountView
import pl.edu.pw.ia.shared.security.Scopes
import pl.edu.pw.ia.shared.security.getAccountId
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty

@Tag(name = "Accounts")
@ApiResponse(responseCode = "200", description = "Ok.")
@ApiResponse(
	responseCode = "404",
	description = "Account not found.",
	content = [Content(schema = Schema(implementation = ApiErrorResponse::class))]
)
@ApiResponse(
	responseCode = "500",
	description = "Internal Server Error.",
	content = [Content(schema = Schema(implementation = ApiErrorResponse::class))]
)
@SecurityRequirement(name = "Bearer")
interface AccountViewController {

	@Operation(description = "Find account by identifier")
	fun findAccount(@PathVariable accountId: UUID): Mono<AccountView>

	@Operation(description = "Find current account info")
	fun findCurrentUser(exchange: ServerWebExchange): Mono<AccountView>

	@Operation(description = "Find account by username")
	fun findAccountByUsername(@RequestParam username: String): Mono<AccountView>
}

@RestController
@RequestMapping(
	value = ["/api/v1/accounts"],
	produces = [MediaType.APPLICATION_JSON_VALUE]
)
class AccountViewControllerImpl(
	private val reactorQueryGateway: ReactorQueryGateway
) : AccountViewController {

	@GetMapping("/{accountId}")
	@PreAuthorize("hasAnyAuthority('${Scopes.USER.READ}')")
	override fun findAccount(@PathVariable accountId: UUID): Mono<AccountView> {
		return reactorQueryGateway.query(
			FindAccountByIdQuery(accountId),
			ResponseTypes.instanceOf(AccountView::class.java)
		).switchIfEmpty {
			Mono.error(AccountNotFoundException(accountId))
		}
	}

	@GetMapping("/me")
	@PreAuthorize("hasAnyAuthority('${Scopes.USER.READ}')")
	override fun findCurrentUser(exchange: ServerWebExchange): Mono<AccountView> {
		return reactorQueryGateway.query(
			FindAccountByIdQuery(exchange.getAccountId()),
			ResponseTypes.instanceOf(AccountView::class.java)
		).switchIfEmpty {
			Mono.error(AccountNotFoundException(exchange.getAccountId()))
		}
	}

	@GetMapping
	@PreAuthorize("hasAnyAuthority('${Scopes.USER.READ}')")
	override fun findAccountByUsername(username: String): Mono<AccountView> {
		return reactorQueryGateway.query(
			FindAccountByUsernameQuery(username),
			ResponseTypes.instanceOf(AccountView::class.java)
		).switchIfEmpty {
			Mono.error(AccountWithUsernameNotFoundException(username))
		}
	}
}
